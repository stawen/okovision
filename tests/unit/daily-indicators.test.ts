import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createMeasurementsRepository } from '../../src/lib/server/repositories/measurements';

function database(sensors: { type: string; columnOko: number }[]) {
	const execute = vi.fn()
		.mockResolvedValueOnce([sensors])
		.mockResolvedValueOnce([[{ sampleCount: 2, conso: '1.56', ecs: '0.00', max: '7.50', min: '-2.00' }]]);
	const query = vi.fn().mockResolvedValue([[{ Field: 'col_1' }, { Field: 'col_2' }, { Field: 'col_3' }, { Field: 'col_4' }]]);
	const db = { execute, query } as Pick<Pool, 'execute' | 'query'>;
	return { repository: createMeasurementsRepository(db), execute, query };
}

const sensors = [
	{ type: 'tc_ext', columnOko: 1 },
	{ type: 'tps_vis', columnOko: 2 },
	{ type: 'tps_vis_pause', columnOko: 3 },
	{ type: 'hotwater[0]', columnOko: 4 }
];

describe('requête des indicateurs', () => {
	it('utilise les colonnes vérifiées et paramètre la date et le coefficient', async () => {
		const { repository, execute } = database(sensors);
		await expect(repository.getDailyIndicators('2026-11-11', 156)).resolves.toEqual({
			sampleCount: 2, conso: 1.56, ecs: 0, max: 7.5, min: -2, missingSensors: false
		});
		const [sql, params] = execute.mock.calls[1];
		expect(sql).toContain('NULLIF(a.`col_2` + a.`col_3`, 0)');
		expect(sql).toContain('a.`col_4` = 1');
		expect(sql).toContain('WHERE a.jour = ?');
		expect(params).toEqual([0.156, 0.156, '2026-11-11']);
	});

	it('ne fabrique pas de consommation ECS lorsque son capteur manque', async () => {
		const { repository, execute } = database(sensors.slice(0, 3));
		execute.mockReset()
			.mockResolvedValueOnce([sensors.slice(0, 3)])
			.mockResolvedValueOnce([[{ sampleCount: 2, conso: '1.56', ecs: null, max: '7.50', min: '-2.00' }]]);
		const result = await repository.getDailyIndicators('2026-11-11', 156);
		expect(result.ecs).toBeNull();
		expect(result.missingSensors).toBe(true);
		expect(execute.mock.calls[1][0]).toContain('NULL AS ecs');
		expect(execute.mock.calls[1][1]).toEqual([0.156, '2026-11-11']);
	});

	it('filtre tous les agrégats sur la plage incluse, convertie de millisecondes en secondes comme le legacy', async () => {
		const { repository, execute } = database(sensors);
		const range = { min: 1794355200123, max: 1794358800987 };
		await repository.getDailyIndicators('2026-11-11', 156, range);
		const [sql, params] = execute.mock.calls[1];
		expect(sql).toContain('WHERE a.jour = ? AND a.timestamp BETWEEN ? AND ?');
		expect(params).toEqual([0.156, 0.156, '2026-11-11', 1794355200, 1794358800]);
	});

	it('garde les mesures indisponibles si la plage ne contient aucun relevé', async () => {
		const { repository, execute } = database(sensors);
		execute.mockReset()
			.mockResolvedValueOnce([sensors])
			.mockResolvedValueOnce([[{ sampleCount: 0, conso: null, ecs: null, max: null, min: null }]]);
		await expect(repository.getDailyIndicators('2026-11-11', 156, { min: 1000, max: 2000 })).resolves.toEqual({
			sampleCount: 0, conso: null, ecs: null, max: null, min: null, missingSensors: false
		});
	});

	it.each([
		{ min: NaN, max: 2000 },
		{ min: 2000, max: 1000 },
		{ min: 1000, max: 1000 },
		{ min: 1000, max: Infinity }
	])('refuse la plage invalide %j avant toute requête', async (range) => {
		const { repository, execute } = database(sensors);
		await expect(repository.getDailyIndicators('2026-11-11', 156, range)).rejects.toThrow('Plage horaire invalide');
		expect(execute).not.toHaveBeenCalled();
	});

	it('refuse les doublons et les colonnes non présentes dans le schéma', async () => {
		const duplicate = database([...sensors, sensors[0]]);
		await expect(duplicate.repository.getDailyIndicators('2026-11-11', 156)).rejects.toThrow('Plusieurs capteurs');
		const invalid = database([{ type: 'tc_ext', columnOko: 999 }]);
		await expect(invalid.repository.getDailyIndicators('2026-11-11', 156)).rejects.toThrow('Colonne absente');
		expect(invalid.execute).toHaveBeenCalledOnce();
	});
});
