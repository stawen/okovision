import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { collectBoiler } from '../../src/lib/server/collection';

describe('collecte planifiée', () => {
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
		expect(mocks.importCsv).toHaveBeenCalledWith('csv', '2026-11-11', expect.any(AbortSignal));
		expect(mocks.save.mock.calls.map((call) => [call[0], call[2]])).toEqual([
			['2026-11-11', true], ['2026-11-12', false], ['2026-11-13', true]
		]);
		expect(progress).toHaveBeenCalledWith(0, 3, '2026-11-11', true);
		expect(progress).toHaveBeenCalledWith(1, 3, '2026-11-11', false);
		expect(mocks.connection.destroy).toHaveBeenCalledOnce();
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
