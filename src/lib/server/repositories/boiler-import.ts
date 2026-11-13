import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { BoilerImportError } from '../boiler-import-error.ts';

interface SensorRow extends RowDataPacket {
	position: number;
	columnOko: number;
	type: string | null;
}

interface ColumnRow extends RowDataPacket {
	Field: string;
}

interface CsvRecord {
	date: string;
	time: string;
	timestamp: number;
	values: (number | null)[];
	status: number | null;
}

function parseDate(value: string): string {
	const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
	if (!match) throw new BoilerImportError('response');
	const [, day, month, year] = match;
	const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
	if (date.getUTCFullYear() !== Number(year)
		|| date.getUTCMonth() !== Number(month) - 1
		|| date.getUTCDate() !== Number(day)) {
		throw new BoilerImportError('response');
	}
	return `${year}-${month}-${day}`;
}

function parseTime(value: string): string {
	const match = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(value.trim());
	if (!match) throw new BoilerImportError('response');
	return `${match[1]}:${match[2]}:00`;
}

function parseValue(value: string): number | null {
	const normalized = value.trim().replace(',', '.');
	if (normalized === '') return null;
	if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized)) {
		throw new BoilerImportError('response');
	}
	const result = Number(normalized);
	if (!Number.isFinite(result)) throw new BoilerImportError('response');
	return result;
}

function parseCsv(contents: string, positions: number[], statusPosition: number): CsvRecord[] {
	const lines = contents.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
	if (lines.length < 2) throw new BoilerImportError('response');
	const records: CsvRecord[] = [];
	const lastPosition = positions.reduce((last, position) => Math.max(last, position), statusPosition);
	for (const line of lines.slice(1)) {
		if (!line.trim()) continue;
		const fields = line.split(';');
		if (fields.length <= lastPosition) {
			throw new BoilerImportError('response');
		}
		const values = positions.map((position) => parseValue(fields[position]));
		const date = parseDate(fields[0]);
		const time = parseTime(fields[1]);
		// The legacy connection forces UTC: CSV wall-clock times are stored as UTC.
		const timestamp = Date.parse(`${date}T${time}Z`) / 1000;
		if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > 4294967295) {
			throw new BoilerImportError('response');
		}
		records.push({
			date,
			time,
			timestamp,
			values,
			status: parseValue(fields[statusPosition])
		});
	}
	if (records.length === 0) throw new BoilerImportError('response');
	return records;
}

function quoteColumn(column: string): string {
	if (!/^col_\d+$/.test(column)) throw new BoilerImportError('mapping');
	return `\`${column}\``;
}

export function createBoilerImportRepository(db: Pick<Pool, 'execute' | 'query'>) {
	return {
		async importCsv(contents: string): Promise<number> {
			try {
				const [sensorRows] = await db.execute<SensorRow[]>(
					`SELECT position_column_csv AS position, column_oko AS columnOko, type
					 FROM oko_capteur
					 WHERE position_column_csv <> -1 OR type = 'startCycle'
					 ORDER BY position_column_csv`
				);
				const [columns] = await db.query<ColumnRow[]>('SHOW COLUMNS FROM oko_historique_full');
				const existingColumns = new Set(columns.map((column) => column.Field));
				if (!['jour', 'heure', 'timestamp'].every((column) => existingColumns.has(column))) {
					throw new BoilerImportError('mapping');
				}

				const positions = new Map<number, SensorRow>();
				const sensorTypes = new Map<string, SensorRow>();
				for (const sensor of sensorRows) {
					if (!Number.isSafeInteger(sensor.position) || !Number.isSafeInteger(sensor.columnOko)
						|| sensor.columnOko < 0) {
						throw new BoilerImportError('mapping');
					}
					if (sensor.type === 'status' || sensor.type === 'startCycle') {
						if (sensorTypes.has(sensor.type)) throw new BoilerImportError('mapping');
						sensorTypes.set(sensor.type, sensor);
					}
					if (sensor.position >= 2 && sensor.type !== 'startCycle') {
						if (positions.has(sensor.position)) throw new BoilerImportError('mapping');
						positions.set(sensor.position, sensor);
					}
				}

				const statusSensor = sensorTypes.get('status');
				const startCycleSensor = sensorTypes.get('startCycle');
				if (!statusSensor || !startCycleSensor || statusSensor.position < 2 || positions.size === 0) {
					throw new BoilerImportError('mapping');
				}
				const orderedSensors = [...positions.entries()].sort(([left], [right]) => left - right);
				const columnsByPosition = orderedSensors.map(([, sensor]) => {
					const column = `col_${sensor.columnOko}`;
					if (!existingColumns.has(column)) throw new BoilerImportError('mapping');
					return quoteColumn(column);
				});
				if (new Set(columnsByPosition).size !== columnsByPosition.length) {
					throw new BoilerImportError('mapping');
				}
				const cycleColumn = `col_${startCycleSensor.columnOko}`;
				const quotedCycleColumn = quoteColumn(cycleColumn);
				if (!existingColumns.has(cycleColumn) || columnsByPosition.includes(quotedCycleColumn)) {
					throw new BoilerImportError('mapping');
				}
				const records = parseCsv(
					contents,
					orderedSensors.map(([position]) => position),
					statusSensor.position
				);
				let previousStatus = 0;
				let imported = 0;

				for (const record of records) {
					const startsCycle = record.status === 4 && record.status !== previousStatus;
					const insertColumns = [...columnsByPosition];
					const values = [...record.values];
					if (startsCycle) {
						insertColumns.push(quotedCycleColumn);
						values.push(1);
					}

					const valuePlaceholders = values.map(() => '?').join(', ');
					const result = await db.execute<ResultSetHeader>(
						`INSERT IGNORE INTO oko_historique_full
							(\`jour\`, \`heure\`, \`timestamp\`, ${insertColumns.join(', ')})
						 VALUES (STR_TO_DATE(?, '%Y-%m-%d'), ?, ?, ${valuePlaceholders})`,
						[
							record.date,
							record.time,
							record.timestamp,
							...values
						]
					);
					imported += result[0].affectedRows;
					previousStatus = record.status ?? 0;
				}
				return imported;
			} catch (cause) {
				if (cause instanceof BoilerImportError) throw cause;
				throw new BoilerImportError('database', cause);
			}
		}
	};
}
