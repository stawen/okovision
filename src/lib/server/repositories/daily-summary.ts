import type { Pool, RowDataPacket } from 'mysql2/promise';
import { createMeasurementsRepository } from './measurements.ts';

interface CountRow extends RowDataPacket {
	count: number;
}

interface SensorRow extends RowDataPacket {
	columnOko: number;
}

interface ColumnRow extends RowDataPacket {
	Field: string;
}

interface CycleRow extends RowDataPacket {
	cycles: string | number | null;
}

export function createDailySummaryRepository(db: Pick<Pool, 'execute' | 'query'>) {
	const measurements = createMeasurementsRepository(db);
	return {
		async isDayComplete(day: string): Promise<boolean> {
			const [rows] = await db.execute<CountRow[]>(
				"SELECT COUNT(*) AS count FROM oko_historique_full WHERE jour = ? AND heure = '23:59:00'",
				[day]
			);
			return Number(rows[0]?.count) === 1;
		},

		async save(day: string, today: string, force: boolean, weight: number, tcRef: number): Promise<'saved' | 'skipped'> {
			if (day === today) return 'skipped';
			const [existing] = await db.execute<CountRow[]>(
				'SELECT COUNT(*) AS count FROM oko_resume_day WHERE jour = ?', [day]
			);
			if (!force && Number(existing[0]?.count) === 1) return 'skipped';

			const indicators = await measurements.getDailyIndicators(day, weight);
			if (!indicators.sampleCount || indicators.max === null || indicators.min === null
				|| indicators.conso === null) {
				throw new Error(`Incomplete measurements for ${day}`);
			}
			const [sensors] = await db.execute<SensorRow[]>(
				"SELECT column_oko AS columnOko FROM oko_capteur WHERE type = 'startCycle'"
			);
			if (sensors.length !== 1 || !Number.isSafeInteger(sensors[0].columnOko) || sensors[0].columnOko < 0) {
				throw new Error('Invalid startCycle sensor');
			}
			const column = `col_${sensors[0].columnOko}`;
			const [columns] = await db.query<ColumnRow[]>('SHOW COLUMNS FROM oko_historique_full');
			if (!columns.some((item) => item.Field === column)) throw new Error('Missing startCycle column');
			const [rows] = await db.execute<CycleRow[]>(
				`SELECT SUM(\`${column}\`) AS cycles FROM oko_historique_full WHERE jour = ?`, [day]
			);
			const cycles = Number(rows[0]?.cycles ?? 0);
			if (!Number.isSafeInteger(cycles) || cycles < 0) throw new Error('Invalid cycle count');
			await db.execute(
				`INSERT INTO oko_resume_day (jour, tc_ext_max, tc_ext_min, conso_kg, conso_ecs_kg, dju, nb_cycle)
				 VALUES (?, ?, ?, ?, ?, GREATEST(0, ROUND(? - ((? + ?) / 2), 2)), ?)
				 ON DUPLICATE KEY UPDATE tc_ext_max = VALUES(tc_ext_max), tc_ext_min = VALUES(tc_ext_min),
				 conso_kg = VALUES(conso_kg), conso_ecs_kg = VALUES(conso_ecs_kg),
				 dju = VALUES(dju), nb_cycle = VALUES(nb_cycle)`,
				[day, indicators.max, indicators.min, indicators.conso, indicators.ecs ?? 0,
					tcRef, indicators.max, indicators.min, cycles]
			);
			return 'saved';
		}
	};
}
