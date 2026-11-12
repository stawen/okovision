import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createDailyChartsRepository } from '../../src/lib/server/repositories/daily-charts';

function database() {
	const execute = vi.fn()
		.mockResolvedValueOnce([[
			{ id: 8, name: 'Hydraulique' },
			{ id: 3, name: 'Températures' }
		]])
		.mockResolvedValueOnce([[
			{ graphId: 3, sensorId: 4, name: 'T° extérieure', column_oko: 5, correctionEffect: '1' },
			{ graphId: 8, sensorId: 9, name: 'T° départ', column_oko: 10, correctionEffect: '-0.5' }
		]])
		.mockResolvedValueOnce([[
			{ timestamp: 1794355200000, series_0: '7.50', series_1: null },
			{ timestamp: 1794355260000, series_0: null, series_1: '12.25' }
		]])
		.mockResolvedValueOnce([[
			{ timestamp: 1794355200000, description: 'Réglage chauffage' }
		]]);
	const query = vi.fn().mockResolvedValue([[
		{ Field: 'col_5' },
		{ Field: 'col_10' }
	]]);
	const db = { execute, query } as Pick<Pool, 'execute' | 'query'>;
	return { repository: createDailyChartsRepository(db), execute, query };
}

describe('requête des graphiques journaliers', () => {
	it('préserve la configuration, les coefficients, les points non nuls et les annotations', async () => {
		const { repository, execute, query } = database();
		await expect(repository.getDailyCharts('2026-11-11')).resolves.toEqual({
			graphs: [
				{
					id: 8,
					name: 'Hydraulique',
					series: [{ name: 'T° départ', data: [[1794355260000, 12.25]] }]
				},
				{
					id: 3,
					name: 'Températures',
					series: [{ name: 'T° extérieure', data: [[1794355200000, 7.5]] }]
				}
			],
			annotations: [{ timestamp: 1794355200000, description: 'Réglage chauffage' }],
			sampleCount: 2
		});
		expect(execute.mock.calls[0][0]).toContain('ORDER BY position, id');
		expect(execute.mock.calls[1][1]).toEqual([8, 3]);
		expect(query).toHaveBeenCalledOnce();
		expect(execute.mock.calls[2][0]).toContain('ROUND(`col_5` * ?, 2) AS `series_0`');
		expect(execute.mock.calls[2][0]).toContain('WHERE jour = ? ORDER BY timestamp');
		expect(execute.mock.calls[2][1]).toEqual([1, -0.5, '2026-11-11']);
		expect(execute.mock.calls[3][0]).toContain('FROM_UNIXTIME(timestamp)');
		expect(execute.mock.calls[3][1]).toEqual(['2026-11-11']);
	});

	it('retourne un état vide sans interroger les capteurs si aucun graphique n’est configuré', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[]]);
		const query = vi.fn();
		const db = { execute, query } as Pick<Pool, 'execute' | 'query'>;
		const repository = createDailyChartsRepository(db);

		await expect(repository.getDailyCharts('2026-11-11')).resolves.toEqual({
			graphs: [],
			annotations: [],
			sampleCount: 0
		});
		expect(execute).toHaveBeenCalledOnce();
		expect(query).not.toHaveBeenCalled();
	});

	it('compte les relevés même si les graphiques configurés n’ont aucune série', async () => {
		const execute = vi.fn()
			.mockResolvedValueOnce([[{ id: 1, name: 'Températures' }]])
			.mockResolvedValueOnce([[]])
			.mockResolvedValueOnce([[{ sampleCount: 2 }]])
			.mockResolvedValueOnce([[]]);
		const query = vi.fn();
		const db = { execute, query } as Pick<Pool, 'execute' | 'query'>;
		const repository = createDailyChartsRepository(db);

		await expect(repository.getDailyCharts('2026-11-11')).resolves.toEqual({
			graphs: [{ id: 1, name: 'Températures', series: [] }],
			annotations: [],
			sampleCount: 2
		});
		expect(execute.mock.calls[2][1]).toEqual(['2026-11-11']);
		expect(query).not.toHaveBeenCalled();
	});

	it('refuse les colonnes de capteur absentes du schéma avant toute lecture de points', async () => {
		const execute = vi.fn()
			.mockResolvedValueOnce([[{ id: 1, name: 'Températures' }]])
			.mockResolvedValueOnce([[
				{ graphId: 1, sensorId: 4, name: 'T° extérieure', column_oko: 99, correctionEffect: '1' }
			]]);
		const query = vi.fn().mockResolvedValue([[{ Field: 'col_4' }]]);
		const db = { execute, query } as Pick<Pool, 'execute' | 'query'>;
		const repository = createDailyChartsRepository(db);

		await expect(repository.getDailyCharts('2026-11-11')).rejects.toThrow('Colonne absente');
		expect(execute).toHaveBeenCalledTimes(2);
	});
});
