import { mkdtemp, readdir, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ collect: vi.fn(), importFile: vi.fn() }));
vi.mock('../../src/lib/server/collection', () => ({
	collectBoiler: mocks.collect,
	importManualFile: mocks.importFile
}));

import { JobManager } from '../../src/lib/server/jobs';

const directories: string[] = [];
async function temporaryDirectory() {
	const directory = await mkdtemp(join(tmpdir(), 'okovision-jobs-'));
	directories.push(directory);
	return directory;
}

afterEach(async () => {
	for (const directory of directories.splice(0)) {
		for (const name of await readdir(directory)) await unlink(join(directory, name));
		await rmdir(directory);
	}
	vi.resetAllMocks();
});

describe('gestionnaire durable des imports', () => {
	it('persiste puis sérialise les imports manuels', async () => {
		const directory = await temporaryDirectory();
		const first = Promise.withResolvers<number>();
		mocks.importFile.mockReturnValueOnce(first.promise).mockResolvedValueOnce(3);
		const manager = new JobManager(directory);
		await manager.start();
		const one = await manager.enqueue('import', '1', 'touch_20261112.csv');
		const two = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(mocks.importFile).toHaveBeenCalledTimes(1));
		expect(manager.get(two.id)?.status).toBe('queued');
		expect(JSON.parse(await readFile(join(directory, `${two.id}.json`), 'utf8')).status).toBe('queued');
		first.resolve(2);
		await vi.waitFor(() => expect(manager.get(two.id)?.status).toBe('completed'));
		expect(manager.get(one.id)).toMatchObject({ status: 'completed', result: { imported: 2 } });
		expect(manager.get(two.id)).toMatchObject({ status: 'completed', result: { imported: 3 } });
		await manager.stop();
	});

	it('déduplique les déclenchements simultanés', async () => {
		const directory = await temporaryDirectory();
		const pending = Promise.withResolvers<{ files: number; imported: number }>();
		mocks.collect.mockReturnValueOnce(pending.promise);
		const manager = new JobManager(directory);
		await manager.start();
		const [one, two] = await Promise.all([
			manager.enqueue('collection', 'scheduler'),
			manager.enqueue('collection', 'scheduler')
		]);
		expect(one.id).toBe(two.id);
		pending.resolve({ files: 0, imported: 0 });
		await vi.waitFor(() => expect(manager.get(one.id)?.status).toBe('completed'));
		await manager.stop();
	});

	it('signale une interruption et impose le recalcul du jour partiellement importé', async () => {
		const directory = await temporaryDirectory();
		const id = 'a4e7f416-01f3-4f37-90d4-bde93a899310';
		await writeFile(join(directory, `${id}.json`), JSON.stringify({
			id, kind: 'collection', status: 'running', author: 'scheduler',
			createdAt: '2026-11-12T00:00:00.000Z', updatedAt: '2026-11-12T00:01:00.000Z',
			progress: { completed: 0, total: 1, day: '2026-11-12', dirty: true }
		}));
		mocks.collect.mockResolvedValueOnce({ files: 1, imported: 1 });
		const manager = new JobManager(directory);
		await manager.start();
		expect(manager.get(id)?.status).toBe('interrupted');
		const retry = await manager.enqueue('collection', 'scheduler');
		await vi.waitFor(() => expect(manager.get(retry.id)?.status).toBe('completed'));
		expect(mocks.collect.mock.calls[0][2]).toEqual(new Set(['2026-11-12']));
		expect(manager.get(id)?.progress?.dirty).toBe(false);
		await manager.stop();
	});

	it('ne transforme pas une erreur d’import en succès', async () => {
		const directory = await temporaryDirectory();
		mocks.importFile.mockRejectedValueOnce(new Error('simulated failure'));
		const manager = new JobManager(directory);
		await manager.start();
		const job = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(manager.get(job.id)?.status).toBe('failed'));
		expect(manager.get(job.id)?.result).toBeUndefined();
		await manager.stop();
	});

	it('ne reprend pas de collecte planifiée en développement', async () => {
		const directory = await temporaryDirectory();
		const id = 'a4e7f416-01f3-4f37-90d4-bde93a899310';
		await writeFile(join(directory, `${id}.json`), JSON.stringify({
			id, kind: 'collection', status: 'queued', author: 'scheduler',
			createdAt: '2026-11-12T00:00:00.000Z', updatedAt: '2026-11-12T00:00:00.000Z'
		}));
		mocks.importFile.mockResolvedValueOnce(1);
		const manager = new JobManager(directory, false);
		await manager.start();
		const manual = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(manager.get(manual.id)?.status).toBe('completed'));
		expect(manager.get(id)?.status).toBe('queued');
		expect(mocks.collect).not.toHaveBeenCalled();
		await manager.stop();
	});

	it('marque une tâche en cours interrompue à l’arrêt', async () => {
		const directory = await temporaryDirectory();
		mocks.importFile.mockImplementation((_filename: string, signal: AbortSignal) =>
			new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true })));
		const manager = new JobManager(directory);
		await manager.start();
		const job = await manager.enqueue('import', '1', 'touch_20261113.csv');
		await vi.waitFor(() => expect(mocks.importFile).toHaveBeenCalledOnce());
		await manager.stop();
		expect(manager.get(job.id)?.status).toBe('interrupted');
	});
});
