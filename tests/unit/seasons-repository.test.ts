import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createSeasonsRepository, SeasonError } from '../../src/lib/server/repositories/seasons';

function repository() {
	const execute = vi.fn();
	const db = { execute } as Pick<Pool, 'execute'>;
	return { execute, seasons: createSeasonsRepository(db) };
}

describe('gestion des saisons', () => {
	it('calcule le libellé et la date de fin à partir du début', async () => {
		const { execute, seasons } = repository();
		execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ affectedRows: 1 }]);

		await seasons.createSeason('2024-09-01');

		expect(execute.mock.calls[0][1]).toEqual(['2024-09-01']);
		expect(execute.mock.calls[1][0]).toContain('INSERT INTO oko_saisons');
		expect(execute.mock.calls[1][1]).toEqual(['2024-2025', '2024-09-01', '2025-08-31']);
	});

	it('calcule correctement une période démarrant un 29 février', async () => {
		const { execute, seasons } = repository();
		execute.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ affectedRows: 1 }]);

		await seasons.createSeason('2024-02-29');

		expect(execute.mock.calls[1][1]).toEqual(['2024-2025', '2024-02-29', '2025-02-28']);
	});

	it('refuse une date impossible avant toute requête', async () => {
		const { execute, seasons } = repository();

		await expect(seasons.createSeason('2025-02-29')).rejects.toBeInstanceOf(SeasonError);
		expect(execute).not.toHaveBeenCalled();
	});

	it('refuse une date de début déjà utilisée', async () => {
		const { execute, seasons } = repository();
		execute.mockResolvedValueOnce([[{ id: 2 }]]);

		await expect(seasons.createSeason('2025-09-01')).rejects.toMatchObject({
			code: 'duplicate-season'
		});
		expect(execute).toHaveBeenCalledOnce();
	});

	it('permet de conserver la date de début lors de la modification', async () => {
		const { execute, seasons } = repository();
		execute
			.mockResolvedValueOnce([[{ id: 3 }]])
			.mockResolvedValueOnce([[]])
			.mockResolvedValueOnce([{ affectedRows: 1 }]);

		await seasons.updateSeason(3, '2025-09-01');

		expect(execute.mock.calls[1][0]).toContain('AND id <> ?');
		expect(execute.mock.calls[1][1]).toEqual(['2025-09-01', 3]);
		expect(execute.mock.calls[2][1]).toEqual(['2025-2026', '2025-09-01', '2026-08-31', 3]);
	});

	it('signale une suppression d’une saison qui n’existe plus', async () => {
		const { execute, seasons } = repository();
		execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

		await expect(seasons.deleteSeason(3)).rejects.toMatchObject({ code: 'season-not-found' });
		expect(execute.mock.calls[0][1]).toEqual([3]);
	});
});
