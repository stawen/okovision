import { beforeEach, describe, expect, it, vi } from 'vitest';

const { indicators } = vi.hoisted(() => ({ indicators: vi.fn() }));
vi.mock('../../src/lib/server/repositories/measurements', () => ({
	createMeasurementsRepository: () => ({ getDailyIndicators: indicators })
}));
import { createDailySummaryRepository } from '../../src/lib/server/repositories/daily-summary';

describe('synthèses du cron', () => {
	const execute = vi.fn();
	const query = vi.fn();
	const db = { execute, query } as never;

	beforeEach(() => {
		vi.resetAllMocks();
		indicators.mockResolvedValue({ sampleCount: 2, min: 4, max: 8, conso: 0.15, ecs: 0.08 });
		query.mockResolvedValue([[{ Field: 'col_99' }], []]);
	});

	it('ne recalcule pas le jour courant ou une synthèse déjà existante', async () => {
		const repository = createDailySummaryRepository(db);
		expect(await repository.save('2026-11-13', '2026-11-13', true, 150, 20)).toBe('skipped');
		expect(execute).not.toHaveBeenCalled();
		execute.mockResolvedValueOnce([[{ count: 1 }], []]);
		expect(await repository.save('2026-11-12', '2026-11-13', false, 150, 20)).toBe('skipped');
		expect(indicators).not.toHaveBeenCalled();
	});

	it('force le recalcul avec les agrégats, le DJU et les cycles', async () => {
		execute.mockResolvedValueOnce([[{ count: 1 }], []])
			.mockResolvedValueOnce([[{ columnOko: 99 }], []])
			.mockResolvedValueOnce([[{ cycles: 2 }], []])
			.mockResolvedValueOnce([{ affectedRows: 2 }, []]);
		const repository = createDailySummaryRepository(db);
		expect(await repository.save('2026-11-12', '2026-11-13', true, 150, 20)).toBe('saved');
		expect(execute.mock.calls[3][0]).toContain('ON DUPLICATE KEY UPDATE');
		expect(execute.mock.calls[3][0]).toContain('GREATEST(0, ROUND(? - ((? + ?) / 2), 2))');
		expect(execute.mock.calls[3][1]).toEqual(['2026-11-12', 8, 4, 0.15, 0.08, 20, 8, 4, 2]);
	});

	it('refuse une synthèse incomplète avant toute écriture', async () => {
		execute.mockResolvedValueOnce([[{ count: 0 }], []]);
		indicators.mockResolvedValueOnce({ sampleCount: 0, min: null, max: null, conso: null, ecs: null });
		const repository = createDailySummaryRepository(db);
		await expect(repository.save('2026-11-12', '2026-11-13', true, 150, 20))
			.rejects.toThrow('Incomplete measurements');
		expect(execute).toHaveBeenCalledTimes(1);
	});
});
