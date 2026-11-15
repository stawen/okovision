import type { Pool, RowDataPacket } from 'mysql2/promise';
import fr from '../csv-dictionaries/fr.json' with { type: 'json' };
import en from '../csv-dictionaries/en.json' with { type: 'json' };
import type { Language } from '../../ui/i18n.ts';

export interface CsvSensor {
	id: number;
	name: string;
	originalName: string;
	position: number;
	columnOko: number;
	type: string | null;
	boiler: string;
}

interface CsvSensorRow extends CsvSensor, RowDataPacket {}

interface ColumnRow extends RowDataPacket {
	Field: string;
}

type DictionaryEntry = { name: string; type: string; boiler: string };

export function parseCsvHeader(contents: string): string[] {
	const line = contents.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/, 1)[0];
	const fields = line.split(';').map((field) => field.trim());
	if (fields.at(-1) === '') fields.pop();
	const sensors = fields.slice(2);
	if (fields.length < 3 || !/^(datum|date)$/i.test(fields[0]) || !/^(zeit|time|heure)$/i.test(fields[1])
		|| sensors.length > 512
		|| fields.some((name) => !name || name.includes('<') || name.includes('>')
			|| [...name].some((character) => character.charCodeAt(0) < 32))
		|| sensors.some((name) => name === 'Start Cycle')
		|| new Set(sensors).size !== sensors.length) {
		throw new Error('Invalid CSV header');
	}
	return fields;
}

export function createCsvMappingRepository(db: Pick<Pool, 'execute' | 'query'>) {
	return {
		async getSensors(): Promise<CsvSensor[]> {
			const [rows] = await db.execute<CsvSensorRow[]>(
				`SELECT id, name, original_name AS originalName, position_column_csv AS position,
				        column_oko AS columnOko, type, boiler
				 FROM oko_capteur ORDER BY position_column_csv, id`
			);
			return rows;
		},

		async update(contents: string, language: Language, mode: 'create' | 'update'): Promise<void> {
			const fields = parseCsvHeader(contents);
			const sensors = await this.getSensors();
			if ((mode === 'create') !== (sensors.length === 0)) throw new Error('Matrix state changed');
			const [columns] = await db.query<ColumnRow[]>('SHOW COLUMNS FROM oko_historique_full');
			const columnNames = new Set(columns.map((column) => column.Field));
			if (!['jour', 'heure', 'timestamp'].every((name) => columnNames.has(name))) {
				throw new Error('Invalid history table');
			}
			const used = new Set<number>();
			const byName = new Map<string, CsvSensor>();
			let cycle: CsvSensor | undefined;
			for (const sensor of sensors) {
				if (!Number.isSafeInteger(sensor.columnOko) || sensor.columnOko < 2
					|| used.has(sensor.columnOko) || !columnNames.has(`col_${sensor.columnOko}`)) {
					throw new Error('Invalid matrix columns');
				}
				used.add(sensor.columnOko);
				if (sensor.type === 'startCycle') {
					if (cycle) throw new Error('Duplicate cycle sensor');
					cycle = sensor;
				} else {
					if (byName.has(sensor.originalName)) throw new Error('Duplicate matrix sensor');
					byName.set(sensor.originalName, sensor);
				}
			}
			if (sensors.length && !cycle) throw new Error('Missing cycle sensor');
			if (columns.some(({ Field }) => /^col_\d+$/.test(Field) && !used.has(Number(Field.slice(4))))) {
				throw new Error('Unmapped history column');
			}
			if (!sensors.length) {
				const [rows] = await db.query<RowDataPacket[]>('SELECT 1 FROM oko_historique_full LIMIT 1');
				if (rows.length) throw new Error('History is not empty');
			}

			const dictionary: Record<string, DictionaryEntry> = language === 'fr' ? fr : en;
			let lastColumn = Math.max(1, ...used);
			const additions: { name: string; position: number; column: number; original: string; type: string; boiler: string }[] = [];
			const positions = new Map<number, number>();
			for (const [position, title] of fields.entries()) {
				if (position < 2) continue;
				const existing = byName.get(title);
				if (existing) {
					positions.set(existing.id, position);
				} else {
					const entry = Object.hasOwn(dictionary, title) ? dictionary[title] : undefined;
					additions.push({
						name: entry?.name ?? title, position, column: ++lastColumn,
						original: title, type: entry?.type ?? '', boiler: entry?.boiler ?? ''
					});
				}
			}
			if (!cycle) {
				additions.push({
					name: 'Start Cycle', position: fields.length, column: lastColumn + 1,
					original: 'Start Cycle', type: 'startCycle', boiler: ''
				});
			} else {
				positions.set(cycle.id, fields.length);
			}
			for (const sensor of byName.values()) {
				if (!positions.has(sensor.id)) positions.set(sensor.id, -1);
			}

			if (additions.length) {
				await db.query(`ALTER TABLE oko_historique_full ${additions.map(
					({ column }) => `ADD COLUMN \`col_${column}\` DECIMAL(6,2) NULL DEFAULT NULL`
				).join(', ')}`);
				const placeholders = additions.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
				await db.execute(
					`INSERT INTO oko_capteur (name, position_column_csv, column_oko, original_name, type, boiler)
					 VALUES ${placeholders}`,
					additions.flatMap(({ name, position, column, original, type, boiler }) =>
						[name, position, column, original, type, boiler])
				);
			}
			if (positions.size) {
				const entries = [...positions.entries()];
				await db.execute(
					`UPDATE oko_capteur SET position_column_csv = CASE id ${entries.map(() => 'WHEN ? THEN ?').join(' ')}
					 ELSE position_column_csv END WHERE id IN (${entries.map(() => '?').join(', ')})`,
					[...entries.flatMap(([id, position]) => [id, position]), ...entries.map(([id]) => id)]
				);
			}
		}
	};
}
