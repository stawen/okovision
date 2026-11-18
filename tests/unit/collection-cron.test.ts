import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getFiles: vi.fn(),
	download: vi.fn(),
	complete: vi.fn(),
	save: vi.fn(),
	importCsv: vi.fn(),
	connection: {
		execute: vi.fn(),
		on: vi.fn(),
		off: vi.fn(),
		destroy: vi.fn()
	}
}));

vi.mock('mysql2/promise', () => ({ createConnection: async () => mocks.connection }));
vi.mock('../../src/lib/server/database', () => ({ databaseOptions: () => ({ host: 'localhost', database: 'test' }) }));
vi.mock('../../src/lib/server/config', () => ({
	readBoilerAddress: async () => 'http://boiler.test',
	readCollectionConfig: async () => ({
		boilerAddress: 'http://boiler.test', timezone: 'Europe/Paris', poidsPellet: 150, tcRef: 20
	})
}));
vi.mock('../../src/lib/server/boiler-import', async (importOriginal) => ({
	...await importOriginal<typeof import('../../src/lib/server/boiler-import')>(),
	createBoilerCsvConnector: () => ({ getFiles: mocks.getFiles, importFile: mocks.download })
}));
vi.mock('../../src/lib/server/repositories/boiler-import', () => ({
	createBoilerImportRepository: () => ({ importCsv: mocks.importCsv })
}));
vi.mock('../../src/lib/server/repositories/daily-summary', () => ({
	createDailySummaryRepository: () => ({ isDayComplete: mocks.complete, save: mocks.save })
}));
vi.mock('../../src/lib/server/repositories/energy', () => ({
	createEnergyRepository: () => ({ mutate: (_signal: AbortSignal, mutation: () => Promise<unknown>) => mutation() })
}));

import { collectBoiler, importManualFile } from '../../src/lib/server/collection';

describe('collecte planifiée', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	beforeEach(() => {
		vi.resetAllMocks();
		mocks.connection.execute.mockResolvedValue([[{ acquired: 1 }], []]);
		mocks.getFiles.mockResolvedValue([
			{ name: 'touch_20261111.csv' },
			{ name: 'touch_20261112.csv' },
			{ name: 'touch_20261113.csv' }
		]);
		mocks.complete.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(true);
		mocks.download.mockResolvedValue('csv');
		mocks.importCsv.mockResolvedValue(3);
		mocks.save.mockResolvedValue('saved');
	});

	it('importe les jours incomplets et force les synthèses importées ou interrompues', async () => {
		const progress = vi.fn().mockResolvedValue(undefined);
		const result = await collectBoiler(new AbortController().signal, progress, new Set(['2026-11-13']));
		expect(result).toEqual({ files: 3, imported: 3 });
		expect(mocks.download).toHaveBeenCalledExactlyOnceWith('http://boiler.test', 'touch_20261111.csv', expect.any(AbortSignal));
		expect(mocks.importCsv).toHaveBeenCalledWith('csv', expect.any(AbortSignal));
		expect(mocks.save.mock.calls.map((call) => [call[0], call[2]])).toEqual([
			['2026-11-11', true], ['2026-11-12', false], ['2026-11-13', true]
		]);
		expect(progress).toHaveBeenCalledWith(0, 3, '2026-11-11', true);
		expect(progress).toHaveBeenCalledWith(1, 3, '2026-11-11', false);
		expect(mocks.connection.destroy).toHaveBeenCalledOnce();
	});

	it('transmet le CSV manuel et le signal sans date issue du nom du fichier', async () => {
		const csv = 'date;heure;temp;status;\n12.11.2026;12:34:56;8,1;4;';
		mocks.download.mockResolvedValue(csv);

		const imported = await importManualFile('touch_20261114.csv', new AbortController().signal);

		expect(imported).toBe(3);
		expect(mocks.download).toHaveBeenCalledExactlyOnceWith('http://boiler.test', 'touch_20261114.csv', expect.any(AbortSignal));
		expect(mocks.importCsv).toHaveBeenCalledExactlyOnceWith(csv, expect.any(AbortSignal));
		expect(mocks.connection.destroy).toHaveBeenCalledOnce();
	});

	it('journalise chaque fichier effectivement importé, même sans nouvelle ligne', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		mocks.complete.mockReset().mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		mocks.importCsv.mockReset().mockResolvedValueOnce(3).mockResolvedValueOnce(0);

		expect(await collectBoiler(new AbortController().signal, vi.fn())).toEqual({ files: 3, imported: 3 });
		expect(info.mock.calls.map(([entry]) => JSON.parse(entry as string))).toEqual([
			expect.objectContaining({ event: 'boilerFileImported', filename: 'touch_20261111.csv', imported: 3 }),
			expect.objectContaining({ event: 'boilerFileImported', filename: 'touch_20261113.csv', imported: 0 })
		]);
	});

	it('journalise le résultat de l’import manuel sans annoncer les imports échoués', async () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		await importManualFile('touch_20261114.csv', new AbortController().signal);
		expect(JSON.parse(info.mock.calls[0][0] as string)).toMatchObject({
			event: 'boilerFileImported', filename: 'touch_20261114.csv', imported: 3
		});

		mocks.importCsv.mockRejectedValueOnce(new Error('import failed'));
		await expect(importManualFile('touch_20261115.csv', new AbortController().signal)).rejects.toThrow('import failed');
		expect(info).toHaveBeenCalledOnce();
	});

	it('échoue si un jour interrompu a disparu de la chaudière', async () => {
		await expect(collectBoiler(new AbortController().signal, vi.fn(), new Set(['2026-11-10'])))
			.rejects.toThrow('Missing file for interrupted day');
		expect(mocks.importCsv).not.toHaveBeenCalled();
	});

	it('refuse toute écriture si le verrou MySQL est indisponible', async () => {
		mocks.connection.execute.mockResolvedValueOnce([[{ acquired: 0 }], []]);
		await expect(collectBoiler(new AbortController().signal, vi.fn())).rejects.toThrow('write lock');
		expect(mocks.importCsv).not.toHaveBeenCalled();
		expect(mocks.save).not.toHaveBeenCalled();
		expect(mocks.connection.destroy).toHaveBeenCalledOnce();
	});
});
