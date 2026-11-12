import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createMaintenanceRepository } from '../../src/lib/server/repositories/maintenance';

function database(lastEmptying: string | null, consumption: string | number | null) {
	const execute = vi.fn()
		.mockResolvedValueOnce([[{ last_emptying: lastEmptying }]])
		.mockResolvedValueOnce([[{ consumption }]]);
	const db = { execute } as Pick<Pool, 'execute'>;
	return { repository: createMaintenanceRepository(db), execute };
}

describe('suivi du cendrier', () => {
	it.each([
		['999.99', 'ok'],
		['1000.00', 'full'],
		['1001.00', 'full'],
		[null, 'no-consumption']
	] as const)('compare la consommation %s au seuil : %s', async (consumption, status) => {
		const { repository, execute } = database('2026-10-01', consumption);
		await expect(repository.getAshtrayStatus(1000)).resolves.toBe(status);
		expect(execute.mock.calls[0][0]).toContain("MAX(event_date) AS last_emptying");
		expect(execute.mock.calls[0][0]).toContain("event_type = 'ASHES'");
		expect(execute.mock.calls[1][0]).toContain('SUM(conso_kg)');
		expect(execute.mock.calls[1][0]).toContain('WHERE jour > ?');
		expect(execute.mock.calls[1][1]).toEqual(['2026-10-01']);
	});

	it('signale l’absence de vidage sans interroger les consommations', async () => {
		const { repository, execute } = database(null, null);
		await expect(repository.getAshtrayStatus(1000)).resolves.toBe('no-emptying');
		expect(execute).toHaveBeenCalledOnce();
	});

	it('ne masque pas une consommation invalide ou une erreur SQL', async () => {
		const invalid = database('2026-10-01', 'invalide');
		await expect(invalid.repository.getAshtrayStatus(1000)).rejects.toThrow('Consommation du cendrier invalide');
		const failed = database('2026-10-01', null);
		failed.execute.mockReset().mockRejectedValueOnce(new Error('SQL'));
		await expect(failed.repository.getAshtrayStatus(1000)).rejects.toThrow('SQL');
	});
});
