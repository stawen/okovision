import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import BoilerImportPage from '../../src/routes/private/configuration/import-boiler/+page.svelte';
import { createBoilerCsvConnector } from '../../src/lib/server/boiler-import';
import { BoilerImportError } from '../../src/lib/server/boiler-import-error';
import { createBoilerImportRepository } from '../../src/lib/server/repositories/boiler-import';

describe('import chaudière', () => {
	it('rend un tableau distinct et une action icône accessible', () => {
		const { body } = render(BoilerImportPage, {
			props: {
				params: {},
				form: null,
				data: {
					language: 'fr',
					member: null,
					pathname: '/private/configuration/import-boiler',
					files: [{ name: 'touch_20260203.csv', url: 'http://boiler.local/logfiles/pelletronic/touch_20260203.csv' }],
					loadError: false
				}
			}
		});

		expect(body).toContain('class="boiler-import-table-scroll"');
		expect(body).toContain('<th scope="col">Fichier disponible sur la chaudière</th>');
		expect(body).toContain('touch_20260203.csv');
		expect(body).toContain('aria-label="Importer les relevés"');
		expect(body).toContain('<svg aria-hidden="true"');
		expect(body).not.toContain('>Importer les relevés</button>');
	});

	it('ne liste que les fichiers journaliers CSV du répertoire chaudière configuré', async () => {
		const fetcher = vi.fn(async () => new Response(`
			<a href="touch_20260203.csv">valid</a>
			<a href="/logfiles/pelletronic/touch_20260201.csv">older</a>
			<a href="http://other.local/logfiles/pelletronic/touch_20260202.csv">external</a>
			<a href="../touch_20260204.csv">outside</a>
			<a href="touch_20260230.csv">invalid date</a>
		`));
		const connector = createBoilerCsvConnector(fetcher);

		const files = await connector.getFiles('http://boiler.local:8180');

		expect(files.map((file) => file.name)).toEqual([
			'touch_20260201.csv',
			'touch_20260203.csv'
		]);
		expect(fetcher).toHaveBeenCalledWith(
			new URL('http://boiler.local:8180/logfiles/pelletronic/'),
			expect.objectContaining({ redirect: 'error', cache: 'no-store' })
		);
	});

	it('refuse un nom arbitraire avant tout téléchargement chaudière', async () => {
		const fetcher = vi.fn(async () => new Response('CSV'));
		const connector = createBoilerCsvConnector(fetcher);

		await expect(connector.importFile('http://boiler.local', 'http://other.local/file.csv'))
			.rejects.toMatchObject({ code: 'response' });
		expect(fetcher).not.toHaveBeenCalled();
	});

	it.each([
		{ charset: 'iso-8859-1' },
		{ charset: undefined }
	])('lit un CSV encodé en Windows-1252/Latin-1 avec ou sans charset déclaré', async ({ charset }) => {
		const headers = charset ? { 'content-type': `text/csv; charset=${charset}` } : { 'content-type': 'text/csv' };
		const body = Buffer.from('date;heure;café;\n13.11.2026;12:00:00;1,5;', 'latin1');
		const fetcher = vi.fn(async () => new Response(body, { headers }));
		const connector = createBoilerCsvConnector(fetcher);

		const csv = await connector.importFile('http://boiler.local', 'touch_20261113.csv');

		expect(csv).toContain('café');
	});

	it('importe selon le mapping, arrondit les secondes et marque le front montant du statut 4', async () => {
		const execute = vi.fn()
			.mockResolvedValueOnce([[
				{ position: 2, columnOko: 2, type: 'tc_ext' },
				{ position: 3, columnOko: 3, type: 'status' },
				{ position: 4, columnOko: 99, type: 'startCycle' }
			], []])
			.mockResolvedValueOnce([{ affectedRows: 1 }, []])
			.mockResolvedValueOnce([{ affectedRows: 1 }, []])
			.mockResolvedValueOnce([{ affectedRows: 0 }, []]);
		const query = vi.fn().mockResolvedValue([[
			{ Field: 'jour' },
			{ Field: 'heure' },
			{ Field: 'timestamp' },
			{ Field: 'col_2' },
			{ Field: 'col_3' },
			{ Field: 'col_99' }
		], []]);
		const repository = createBoilerImportRepository({ execute, query } as never);

		const imported = await repository.importCsv([
			'date;heure;temp;status;',
			'03.02.2026;12:34:56;12,5;0;',
			'03.02.2026;12:35:10;12,75;4;',
			'03.02.2026;12:35:55;12,8;4;'
		].join('\r\n'));

		expect(imported).toBe(2);
		expect(execute.mock.calls[1]?.[0]).toContain("STR_TO_DATE(?, '%Y-%m-%d')");
		expect(execute.mock.calls[1]?.[0]).not.toContain('UNIX_TIMESTAMP');
		expect(execute.mock.calls[1]?.[1]).toEqual(['2026-02-03', '12:34:00', 1770122040, 12.5, 0]);
		expect(execute.mock.calls[2]?.[0]).toContain('`col_99`');
		expect(execute.mock.calls[2]?.[1]).toEqual([
			'2026-02-03', '12:35:00', 1770122100, 12.75, 4, 1
		]);
		expect(execute.mock.calls[3]?.[0]).not.toContain('`col_99`');
	});

	it.each([
		{ date: '03.02.2026', day: '2026-02-03', timestamp: 1770122040 },
		{ date: '03.07.2026', day: '2026-07-03', timestamp: 1783082040 }
	])('conserve le timestamp UTC legacy et les colonnes remappées pour $day', async ({ date, day, timestamp }) => {
		const execute = vi.fn()
			.mockResolvedValueOnce([[
				{ position: 2, columnOko: 18, type: 'tc_ext' },
				{ position: 4, columnOko: 7, type: 'status' },
				{ position: 5, columnOko: 99, type: 'startCycle' }
			], []])
			.mockResolvedValue([{ affectedRows: 1 }, []]);
		const query = vi.fn().mockResolvedValue([[
			{ Field: 'jour' }, { Field: 'heure' }, { Field: 'timestamp' },
			{ Field: 'col_18' }, { Field: 'col_7' }, { Field: 'col_99' }
		], []]);
		const repository = createBoilerImportRepository({ execute, query } as never);

		await repository.importCsv(`date;heure;temp;unmapped;status\n${date};12:34:59;-2,75;ignored;4`);

		expect(execute.mock.calls[1]?.[0]).toContain('`col_18`, `col_7`, `col_99`');
		expect(execute.mock.calls[1]?.[1]).toEqual([day, '12:34:00', timestamp, -2.75, 4, 1]);
	});

	it('refuse un CSV invalide avant toute insertion', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[
			{ position: 2, columnOko: 2, type: 'tc_ext' },
			{ position: 3, columnOko: 3, type: 'status' },
			{ position: -1, columnOko: 99, type: 'startCycle' }
		], []]);
		const query = vi.fn().mockResolvedValue([[
			{ Field: 'jour' },
			{ Field: 'heure' },
			{ Field: 'timestamp' },
			{ Field: 'col_2' },
			{ Field: 'col_3' },
			{ Field: 'col_99' }
		], []]);
		const repository = createBoilerImportRepository({ execute, query } as never);

		await expect(repository.importCsv('date;heure;temp;status;\n31.02.2026;12:34:00;12,5;0;'))
			.rejects.toBeInstanceOf(BoilerImportError);
		expect(execute).toHaveBeenCalledTimes(1);
	});
});
