import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { getDailyIndicators } from '../../src/lib/server/queries/daily-indicators';

function database(sensors: { type: string; column_oko: number }[]) {
	const execute = vi.fn()
		.mockResolvedValueOnce([sensors])
		.mockResolvedValueOnce([[{ sample_count: 2, conso: '1.56', ecs: '0.00', max: '7.50', min: '-2.00' }]]);
	const query = vi.fn().mockResolvedValue([[{ Field: 'col_1' }, { Field: 'col_2' }, { Field: 'col_3' }, { Field: 'col_4' }]]);
	return { pool: { execute, query } as Pick<Pool, 'execute' | 'query'>, execute, query };
}

const sensors = [
	{ type: 'tc_ext', column_oko: 1 },
	{ type: 'tps_vis', column_oko: 2 },
	{ type: 'tps_vis_pause', column_oko: 3 },
	{ type: 'hotwater[0]', column_oko: 4 }
];

describe('requête des indicateurs', () => {
	it('utilise les colonnes vérifiées et paramètre la date et le coefficient', async () => {
		const { pool, execute } = database(sensors);
		await expect(getDailyIndicators(pool, '2026-11-11', 156)).resolves.toEqual({
			sampleCount: 2, conso: 1.56, ecs: 0, max: 7.5, min: -2, missingSensors: false
		});
		const [sql, params] = execute.mock.calls[1];
		expect(sql).toContain('NULLIF(a.`col_2` + a.`col_3`, 0)');
		expect(sql).toContain('a.`col_4` = 1');
		expect(sql).toContain('WHERE a.jour = ?');
		expect(params).toEqual([0.156, 0.156, '2026-11-11']);
	});

	it('ne fabrique pas de consommation ECS lorsque son capteur manque', async () => {
		const { pool, execute } = database(sensors.slice(0, 3));
		execute.mockReset()
			.mockResolvedValueOnce([sensors.slice(0, 3)])
			.mockResolvedValueOnce([[{ sample_count: 2, conso: '1.56', ecs: null, max: '7.50', min: '-2.00' }]]);
		const result = await getDailyIndicators(pool, '2026-11-11', 156);
		expect(result.ecs).toBeNull();
		expect(result.missingSensors).toBe(true);
		expect(execute.mock.calls[1][0]).toContain('NULL AS ecs');
		expect(execute.mock.calls[1][1]).toEqual([0.156, '2026-11-11']);
	});

	it('refuse les doublons et les colonnes non présentes dans le schéma', async () => {
		const duplicate = database([...sensors, sensors[0]]);
		await expect(getDailyIndicators(duplicate.pool, '2026-11-11', 156)).rejects.toThrow('Plusieurs capteurs');
		const invalid = database([{ type: 'tc_ext', column_oko: 999 }]);
		await expect(getDailyIndicators(invalid.pool, '2026-11-11', 156)).rejects.toThrow('Colonne absente');
		expect(invalid.execute).toHaveBeenCalledOnce();
	});
});
