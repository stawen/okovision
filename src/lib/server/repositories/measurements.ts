import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getMessages } from '../messages.ts';
import { isChartRange, type ChartRange, type DailyIndicators } from '../../indicators/daily.ts';

export type { DailyIndicators } from '../../indicators/daily.ts';

interface SensorRow extends RowDataPacket {
	type: string;
	columnOko: number;
}

interface ColumnRow extends RowDataPacket {
	Field: string;
}

interface IndicatorRow extends RowDataPacket {
	sampleCount: number;
	conso: string | number | null;
	ecs: string | number | null;
	max: string | number | null;
	min: string | number | null;
}

function numericValue(value: string | number | null): number | null {
	const messages = getMessages();
	if (value === null) return null;
	const result = Number(value);
	if (!Number.isFinite(result)) throw new Error(messages.invalidIndicator);
	return result;
}

export function createMeasurementsRepository(db: Pick<Pool, 'execute' | 'query'>) {
	return {
		async getDailyIndicators(day: string, poidsPellet: number, range?: ChartRange): Promise<DailyIndicators> {
			const messages = getMessages();
			if (range && !isChartRange(range)) throw new Error(messages.invalidIndicatorRange);
			const types = ['tc_ext', 'tps_vis', 'tps_vis_pause', 'hotwater[0]'];
			const [sensors] = await db.execute<SensorRow[]>(
				'SELECT type, column_oko AS columnOko FROM oko_capteur WHERE type IN (?, ?, ?, ?)',
				types
			);
			const [columns] = await db.query<ColumnRow[]>('SHOW COLUMNS FROM oko_historique_full');
			const existingColumns = new Set(columns.map((column) => column.Field));
			const selected = new Map<string, string>();
			for (const sensor of sensors) {
				if (selected.has(sensor.type)) throw new Error(messages.duplicateSensor(sensor.type));
				if (!Number.isSafeInteger(sensor.columnOko) || sensor.columnOko < 0) {
					throw new Error(messages.invalidSensorColumn(sensor.type));
				}
				const column = `col_${sensor.columnOko}`;
				if (!existingColumns.has(column)) throw new Error(messages.missingSensorColumn(sensor.type));
				selected.set(sensor.type, `a.\`${column}\``);
			}

			const temperature = selected.get('tc_ext');
			const vis = selected.get('tps_vis');
			const pause = selected.get('tps_vis_pause');
			const hotwater = selected.get('hotwater[0]');
			const ratio = vis && pause ? `((1 / NULLIF(${vis} + ${pause}, 0)) * ${vis})` : undefined;
			const conso = ratio ? `ROUND(SUM(${ratio}) * ?, 2)` : 'NULL';
			const ecs = ratio && hotwater ? `ROUND(SUM(CASE WHEN ${hotwater} = 1 THEN ${ratio} END) * ?, 2)` : 'NULL';
			const max = temperature ? `ROUND(MAX(${temperature}), 2)` : 'NULL';
			const min = temperature ? `ROUND(MIN(${temperature}), 2)` : 'NULL';
			const parameters: (number | string)[] = [];
			if (ratio) parameters.push(poidsPellet / 1000);
			if (ratio && hotwater) parameters.push(poidsPellet / 1000);
			parameters.push(day);
			if (range) parameters.push(Math.floor(range.min / 1000), Math.floor(range.max / 1000));
			const [rows] = await db.execute<IndicatorRow[]>(
				`SELECT COUNT(*) AS sampleCount, ${conso} AS conso, ${ecs} AS ecs, ${max} AS max, ${min} AS min
		 FROM oko_historique_full AS a WHERE a.jour = ?${range ? ' AND a.timestamp BETWEEN ? AND ?' : ''}`,
				parameters
			);
			const row = rows[0];
			if (!row) throw new Error(messages.indicatorsNoResult);
			return {
				sampleCount: row.sampleCount,
				conso: numericValue(row.conso),
				ecs: numericValue(row.ecs),
				max: numericValue(row.max),
				min: numericValue(row.min),
				missingSensors: types.some((type) => !selected.has(type))
			};
		}
	};
}
