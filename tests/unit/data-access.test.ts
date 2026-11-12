import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDatabasePool, execute, query } = vi.hoisted(() => ({
	getDatabasePool: vi.fn(),
	execute: vi.fn(),
	query: vi.fn()
}));

vi.mock('../../src/lib/server/database', () => ({ getDatabasePool }));

describe('câblage des accès aux données', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.resetAllMocks();
		getDatabasePool.mockReturnValue({ execute, query });
	});

	it('initialise les repositories au premier besoin et réutilise le même assemblage', async () => {
		const { getDataAccess } = await import('../../src/lib/server/data-access');
		expect(getDatabasePool).not.toHaveBeenCalled();

		const dataAccess = getDataAccess();
		expect(getDataAccess()).toBe(dataAccess);
		expect(getDatabasePool).toHaveBeenCalledOnce();
		expect(execute).not.toHaveBeenCalled();
		expect(query).not.toHaveBeenCalled();

		execute
			.mockResolvedValueOnce([[]])
			.mockResolvedValueOnce([[{ sample_count: 0, conso: null, ecs: null, max: null, min: null }]])
			.mockResolvedValueOnce([[{ last_emptying: null }]]);
		query.mockResolvedValueOnce([[]]);
		await expect(dataAccess.measurements.getDailyIndicators('2026-11-11', 156)).resolves.toEqual({
			sampleCount: 0, conso: null, ecs: null, max: null, min: null, missingSensors: true
		});
		await expect(dataAccess.maintenance.getAshtrayStatus(1000)).resolves.toBe('no-emptying');
		expect(getDatabasePool).toHaveBeenCalledOnce();
	});

	it('propage une erreur d’initialisation sans mémoriser un assemblage incomplet', async () => {
		const { getDataAccess } = await import('../../src/lib/server/data-access');
		const failure = new Error('configuration indisponible');
		getDatabasePool.mockImplementationOnce(() => { throw failure; });

		expect(() => getDataAccess()).toThrow(failure);
		const dataAccess = getDataAccess();
		expect(getDataAccess()).toBe(dataAccess);
		expect(getDatabasePool).toHaveBeenCalledTimes(2);
	});
});
