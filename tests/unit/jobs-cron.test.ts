import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ collect: vi.fn(), importFile: vi.fn() }));
vi.mock('../../src/lib/server/collection', () => ({
	collectBoiler: mocks.collect,
	importManualFile: mocks.importFile
}));

import { JobManager } from '../../src/lib/server/jobs';

afterEach(async () => {
	vi.useRealTimers();
	vi.resetAllMocks();
});

describe('gestionnaire mémoire des imports', () => {
	it('sérialise les imports manuels et oublie les tâches dans un nouveau processus', async () => {
		const first = Promise.withResolvers<number>();
		mocks.importFile.mockReturnValueOnce(first.promise).mockResolvedValueOnce(3);
		const manager = new JobManager();
		const one = await manager.enqueue('import', '1', 'touch_20261112.csv');
		const two = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(mocks.importFile).toHaveBeenCalledTimes(1));
		expect(manager.get(two.id)?.status).toBe('queued');
		first.resolve(2);
		await vi.waitFor(() => expect(manager.get(two.id)?.status).toBe('completed'));
		expect(manager.get(one.id)).toMatchObject({ status: 'completed', result: { imported: 2 } });
		expect(manager.get(two.id)).toMatchObject({ status: 'completed', result: { imported: 3 } });
		expect(new JobManager().get(one.id)).toBeUndefined();
		await manager.stop();
	});

	it('déduplique les déclenchements simultanés', async () => {
		const pending = Promise.withResolvers<{ files: number; imported: number }>();
		mocks.collect.mockReturnValueOnce(pending.promise);
		const manager = new JobManager();
		const [one, two] = await Promise.all([
			manager.enqueue('collection', 'scheduler'),
			manager.enqueue('collection', 'scheduler')
		]);
		expect(one.id).toBe(two.id);
		pending.resolve({ files: 0, imported: 0 });
		await vi.waitFor(() => expect(manager.get(one.id)?.status).toBe('completed'));
		await manager.stop();
	});

	it('impose le recalcul d’un jour partiellement importé lors d’une nouvelle collecte', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		const startedAt = new Date('2026-11-15T12:00:00.000Z');
		vi.setSystemTime(startedAt);
		mocks.collect
			.mockImplementationOnce(async (_signal: AbortSignal, progress: (completed: number, total: number, day: string, dirty: boolean) => Promise<void>) => {
				await progress(0, 1, '2026-11-12', true);
				throw new Error('simulated partial import');
			})
			.mockResolvedValueOnce({ files: 1, imported: 1 });
		const manager = new JobManager();
		const failed = await manager.enqueue('collection', 'scheduler');
		await vi.waitFor(() => expect(manager.get(failed.id)?.status).toBe('failed'));
		vi.setSystemTime(startedAt.getTime() + 60 * 60 * 1000);
		expect(manager.get(failed.id)).toBeUndefined();
		const retry = await manager.enqueue('collection', 'scheduler');
		await vi.waitFor(() => expect(manager.get(retry.id)?.status).toBe('completed'));
		expect(mocks.collect.mock.calls[1][2]).toEqual(new Set(['2026-11-12']));
		await manager.stop();
	});

	it('ne transforme pas une erreur d’import en succès', async () => {
		mocks.importFile.mockRejectedValueOnce(new Error('simulated failure'));
		const manager = new JobManager();
		const job = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(manager.get(job.id)?.status).toBe('failed'));
		expect(manager.get(job.id)?.result).toBeUndefined();
		await manager.stop();
	});

	it('ne lance pas de collecte planifiée en développement', async () => {
		mocks.importFile.mockResolvedValueOnce(1);
		const manager = new JobManager(false);
		const scheduled = await manager.enqueue('collection', 'scheduler');
		const manual = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(manager.get(manual.id)?.status).toBe('completed'));
		expect(manager.get(scheduled.id)?.status).toBe('queued');
		expect(mocks.collect).not.toHaveBeenCalled();
		await manager.stop();
	});

	it('marque une tâche en cours interrompue à l’arrêt', async () => {
		mocks.importFile.mockImplementation((_filename: string, signal: AbortSignal) =>
			new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })));
		const manager = new JobManager();
		const job = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(mocks.importFile).toHaveBeenCalledOnce());
		await manager.stop();
		expect(manager.get(job.id)?.status).toBe('interrupted');
	});

	it('exécute une collecte manuelle en développement et déduplique les demandes', async () => {
		const pending = Promise.withResolvers<{ files: number; imported: number }>();
		mocks.collect.mockReturnValueOnce(pending.promise);
		const manager = new JobManager(false);
		const [one, two] = await Promise.all([
			manager.enqueueCollection('1'),
			manager.enqueueCollection('1')
		]);
		expect(one.id).toBe(two.id);
		expect(one).toMatchObject({ kind: 'collection', manual: true, author: '1' });
		await vi.waitFor(() => expect(mocks.collect).toHaveBeenCalledOnce());
		pending.resolve({ files: 1, imported: 3 });
		await vi.waitFor(() => expect(manager.get(one.id)?.status).toBe('completed'));
		expect(manager.get(one.id)?.result).toEqual({ files: 1, imported: 3 });
		await manager.stop();
	});

	it('active la collecte planifiée en attente sans créer de doublon ni activer le calendrier', async () => {
		mocks.collect.mockResolvedValueOnce({ files: 0, imported: 0 });
		const manager = new JobManager(false);
		const scheduled = await manager.enqueue('collection', 'scheduler');
		expect(mocks.collect).not.toHaveBeenCalled();
		const manual = await manager.enqueueCollection('1');
		expect(manual.id).toBe(scheduled.id);
		await vi.waitFor(() => expect(manager.get(manual.id)?.status).toBe('completed'));
		expect(manager.get(manual.id)).toMatchObject({ manual: true, author: '1', status: 'completed' });
		const next = await manager.enqueue('collection', 'scheduler');
		expect(manager.get(next.id)?.status).toBe('queued');
		expect(mocks.collect).toHaveBeenCalledOnce();
		await manager.stop();
	});

	it('expire les tâches terminales une heure après leur dernière mise à jour', async () => {
		vi.useFakeTimers({ toFake: ['Date'] });
		const startedAt = new Date('2026-11-15T12:00:00.000Z');
		vi.setSystemTime(startedAt);
		const pending = Promise.withResolvers<number>();
		mocks.importFile.mockReturnValueOnce(pending.promise);
		const manager = new JobManager();
		const job = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(mocks.importFile).toHaveBeenCalledOnce());
		vi.setSystemTime(startedAt.getTime() + 60 * 60 * 1000);
		expect(manager.get(job.id)?.status).toBe('running');
		pending.resolve(1);
		await vi.waitFor(() => expect(manager.get(job.id)?.status).toBe('completed'));
		const completedAt = Date.parse(manager.get(job.id)!.updatedAt);
		vi.setSystemTime(completedAt + 60 * 60 * 1000 - 1);
		expect(manager.get(job.id)?.status).toBe('completed');
		vi.setSystemTime(completedAt + 60 * 60 * 1000);
		expect(manager.get(job.id)).toBeUndefined();
		await manager.stop();
	});
});
