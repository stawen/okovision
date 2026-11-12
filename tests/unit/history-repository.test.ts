import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createHistoryRepository } from '../../src/lib/server/repositories/history';
import { createMaintenanceRepository } from '../../src/lib/server/repositories/maintenance';

const totals = {
	sampleCount: 2, tcExtMax: '8.0', tcExtMin: '-2.0', consoKg: '12.50',
	consoEcsKg: '0.00', dju: '10.00', nbCycle: 4
};
const season = { id: 2, name: 'Saison', startDate: '2025-09-10', endDate: '2026-09-15' };

function database() {
	const execute = vi.fn();
	const db = { execute } as Pick<Pool, 'execute'>;
	return { execute, history: createHistoryRepository(db), maintenance: createMaintenanceRepository(db) };
}

describe('requêtes de synthèse historique', () => {
	it('ne propose que les années présentes dans les synthèses quotidiennes', async () => {
		const { execute, history } = database();
		execute.mockResolvedValueOnce([[{ year: 2026 }, { year: 2024 }]]);
		await expect(history.getYears()).resolves.toEqual([2026, 2024]);
		expect(execute.mock.calls[0][0]).toBe(
			'SELECT DISTINCT YEAR(jour) AS year FROM oko_resume_day ORDER BY year DESC'
		);
	});

	it('aligne les journées sur le calendrier et calcule les totaux sur toutes les synthèses', async () => {
		const { execute, history } = database();
		execute.mockResolvedValueOnce([[
			{ day: 1, tcExtMax: '8.0', tcExtMin: '-2.0', consoKg: '12.5', dju: '10', nbCycle: 4 },
			{ day: 3, tcExtMax: null, tcExtMin: null, consoKg: null, dju: null, nbCycle: null }
		]]).mockResolvedValueOnce([[totals]]);
		const result = await history.getMonthlyHistory(2, 2024);
		expect(result.chart.max).toHaveLength(29);
		expect(result.chart.max.slice(0, 3)).toEqual([8, null, null]);
		expect(result.indicators).toEqual({
			sampleCount: 2, conso: 12.5, ecs: 0, max: 8, mean: 3, min: -2, dju: 10, cycles: 4
		});
		expect(execute.mock.calls[0][1]).toEqual(['2024-02-01', '2024-02-01']);
		expect(execute.mock.calls[1][0]).toContain('FROM oko_resume_day WHERE jour BETWEEN ? AND ?');
		expect(execute.mock.calls[1][1]).toEqual(['2024-02-01', '2024-02-29']);
	});

	it('groupe les mois par année, respecte les bornes de saison et préserve les valeurs absentes', async () => {
		const { execute, history } = database();
		execute.mockResolvedValueOnce([[
			{ ...totals, year: 2025, month: 9 },
			{ ...totals, year: 2026, month: 9, sampleCount: 0, consoKg: null, dju: null, nbCycle: null }
		]]).mockResolvedValueOnce([[totals]]);
		const result = await history.getSeasonHistory(season, 150);
		expect(result.months.map((month) => [month.year, month.month, month.efficiency]))
			.toEqual([[2025, 9, 8.33], [2026, 9, null]]);
		expect(result.months[1].consumption).toBeNull();
		expect(result.indicators.conso).toBe(12.5);
		expect(execute.mock.calls[0][0]).toContain('GROUP BY YEAR(calendar.jour), MONTH(calendar.jour)');
		expect(execute.mock.calls[0][1]).toEqual([season.startDate, season.endDate]);
		expect(execute.mock.calls[1][1]).toEqual([season.startDate, season.endDate]);
	});

	it('ne fabrique ni totaux ni efficacité en l’absence de données', async () => {
		const { execute, history } = database();
		execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[
			{ sampleCount: 0, tcExtMax: null, tcExtMin: null, consoKg: null, consoEcsKg: null, dju: null, nbCycle: null }
		]]);
		const result = await history.getMonthlyHistory(11, 2026);
		expect(result.indicators).toEqual({
			sampleCount: 0, conso: null, ecs: null, max: null, mean: null, min: null, dju: null, cycles: null
		});
	});

	it('rejette une donnée numérique invalide', async () => {
		const { execute, history } = database();
		execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ ...totals, consoKg: 'invalid' }]]);
		await expect(history.getMonthlyHistory(1, 2026)).rejects.toThrow('Valeur d’indicateur invalide');
	});
});

describe('stock historique', () => {
	it.each([
		[true, 4000, 'PELLET', 48],
		[false, null, 'BAG', 95]
	] as const)('calcule le stock depuis le dernier remplissage (%s)', async (hasSilo, capacity, type, percent) => {
		const { execute, maintenance } = database();
		execute.mockResolvedValueOnce([[{ eventDate: '2026-10-01', pelletQuantity: 2000 }]])
			.mockResolvedValueOnce([[{ consumption: '100.00' }]]);
		await expect(maintenance.getStockStatus(hasSilo, capacity))
			.resolves.toEqual({ status: 'available', remains: 1900, percent });
		expect(execute.mock.calls[0][1]).toEqual([type]);
		expect(execute.mock.calls[1][0]).toContain('WHERE jour > ?');
		expect(execute.mock.calls[1][1]).toEqual(['2026-10-01']);
	});

	it('signale la configuration, le remplissage ou la consommation manquants', async () => {
		const { execute, maintenance } = database();
		await expect(maintenance.getStockStatus(null, null)).resolves.toEqual({ status: 'unavailable' });
		await expect(maintenance.getStockStatus(true, null)).resolves.toEqual({ status: 'unavailable' });
		expect(execute).not.toHaveBeenCalled();
		execute.mockResolvedValueOnce([[]]);
		await expect(maintenance.getStockStatus(false, null)).resolves.toEqual({ status: 'no-fill' });
		execute.mockResolvedValueOnce([[{ eventDate: '2026-10-01', pelletQuantity: 2000 }]])
			.mockResolvedValueOnce([[{ consumption: null }]]);
		await expect(maintenance.getStockStatus(false, null)).resolves.toEqual({ status: 'no-consumption' });
	});
});
