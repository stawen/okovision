import { render } from 'svelte/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCsvMappingRepository, parseCsvHeader, type CsvSensor } from '../../src/lib/server/repositories/csv-mapping';
import { BoilerImportError } from '../../src/lib/server/boiler-import-error';
import CsvMappingPage from '../../src/routes/private/administration/csv-mapping/+page.svelte';

const mocks = vi.hoisted(() => ({
	getSensors: vi.fn(),
	readConfiguration: vi.fn(),
	parseBoilerAddress: vi.fn(),
	importFile: vi.fn(),
	withWriteLock: vi.fn(),
	update: vi.fn()
}));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({ csvMapping: { getSensors: mocks.getSensors } })
}));
vi.mock('../../src/lib/server/config', () => ({
	readConfiguration: mocks.readConfiguration, parseBoilerAddress: mocks.parseBoilerAddress
}));
vi.mock('../../src/lib/server/boiler-import', () => ({
	createBoilerCsvConnector: () => ({ importFile: mocks.importFile })
}));
vi.mock('../../src/lib/server/collection', () => ({ withWriteLock: mocks.withWriteLock }));
vi.mock('../../src/lib/server/repositories/csv-mapping', async (importOriginal) => {
	const original = await importOriginal<typeof import('../../src/lib/server/repositories/csv-mapping')>();
	return { ...original, createCsvMappingRepository: (db: unknown) =>
		db === 'locked' ? { update: mocks.update } : original.createCsvMappingRepository(db as never) };
});

import { actions } from '../../src/routes/private/administration/csv-mapping/+page.server';

const baseColumns = ['jour', 'heure', 'timestamp'].map((Field) => ({ Field }));
const sensor = (id: number, originalName: string, position: number, columnOko: number, type = '') => ({
	id, originalName, name: `Nom ${id}`, position, columnOko, type, boiler: ''
});

describe('matrice CSV', () => {
	it('initialise les colonnes, les noms connus et inconnus et le début de cycle', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);
		const query = vi.fn().mockResolvedValueOnce([baseColumns, []]).mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);
		const repository = createCsvMappingRepository({ execute, query } as never);

		await repository.update('\uFEFFDatum;Zeit;AT [°C];PE1 Status;inconnu;\r\n', 'fr', 'create');

		expect(query.mock.calls[2][0]).toContain('ADD COLUMN `col_2` DECIMAL(6,2)');
		expect(query.mock.calls[2][0]).toContain('ADD COLUMN `col_5` DECIMAL(6,2)');
		expect(execute.mock.calls[1][1]).toEqual([
			'T°C Extérieure', 2, 2, 'AT [°C]', 'tc_ext', 'CAPPL:LOCAL.L_aussentemperatur_ist',
			'Statut chaudière', 3, 3, 'PE1 Status', 'status', 'CAPPL:FA[0].L_kesselstatus',
			'inconnu', 4, 4, 'inconnu', '', '',
			'Start Cycle', 5, 5, 'Start Cycle', 'startCycle', ''
		]);
	});

	it('utilise les libellés anglais pour les capteurs de la matrice', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);
		const query = vi.fn().mockResolvedValueOnce([baseColumns, []]).mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);

		await createCsvMappingRepository({ execute, query } as never)
			.update('Datum;Zeit;HK2 VL Ist[°C];Zubrp1 Pumpe;PE2 Motor RES1;', 'en', 'create');

		expect(execute.mock.calls[1][1]).toEqual([
			'Heating circuit 2 - Flow T°C', 2, 2, 'HK2 VL Ist[°C]', '', 'CAPPL:LOCAL.L_hk[1].vorlauftemp_ist',
			'Pump (undefined)', 3, 3, 'Zubrp1 Pumpe', '', 'CAPPL:LOCAL.L_zubrp[0].pumpe',
			'OKO [2] - Motor Intermediate hopper', 4, 4, 'PE2 Motor RES1', '', 'CAPPL:FA[1].ausgang_motor[3]',
			'Start Cycle', 5, 5, 'Start Cycle', 'startCycle', ''
		]);
	});

	it.each(['fr', 'en'] as const)('associe les capteurs corrigés à la bonne variable chaudière en %s', async (language) => {
		const mappings = [
			['HK2 RT Ist[°C]', 'CAPPL:LOCAL.L_hk[1].raumtemp_ist'],
			['HK2 RT Soll[°C]', 'CAPPL:LOCAL.L_hk[1].raumtemp_soll'],
			['WW1 AusT Ist[°C]', 'CAPPL:LOCAL.L_ww[0].ausschaltfuehler_ist'],
			['WW1 Soll[°C]', 'CAPPL:LOCAL.L_ww[0].temp_soll'],
			['WW2 AusT Ist[°C]', 'CAPPL:LOCAL.L_ww[1].ausschaltfuehler_ist'],
			['WW2 Soll[°C]', 'CAPPL:LOCAL.L_ww[1].temp_soll'],
			['Zubrp1 Pumpe', 'CAPPL:LOCAL.L_zubrp[0].pumpe'],
			['PU1 TPO Ist[°C]', 'CAPPL:LOCAL.L_pu[0].einschaltfuehler_ist'],
			['PU1 TPO Soll[°C]', 'CAPPL:LOCAL.L_pu[0].einschaltfuehler_soll'],
			['PU1 TPM Ist[°C]', 'CAPPL:LOCAL.L_pu[0].ausschaltfuehler_ist'],
			['PU1 TPM Soll[°C]', 'CAPPL:LOCAL.L_pu[0].ausschaltfuehler_soll'],
			['PE2 FRT Soll[°C]', 'CAPPL:FA[1].L_feuerraumtemperatur_soll'],
			['PE2 Pausenzeit[zs]', 'CAPPL:FA[1].L_pausenzeit'],
			['PE2 Motor RES1', 'CAPPL:FA[1].ausgang_motor[3]']
		];
		const execute = vi.fn().mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);
		const query = vi.fn().mockResolvedValueOnce([baseColumns, []]).mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);

		await createCsvMappingRepository({ execute, query } as never)
			.update(`Datum;Zeit;${mappings.map(([name]) => name).join(';')};`, language, 'create');

		const values = execute.mock.calls[1][1];
		for (const [index, [name, boiler]] of mappings.entries()) {
			expect(values[index * 6 + 3]).toBe(name);
			expect(values[index * 6 + 5]).toBe(boiler);
		}
	});

	it.each(['fr', 'en'] as const)('reconnaît les colonnes supplémentaires de chaudière en %s', async (language) => {
		const mappings = [
			['HK1 Mischer', 'CAPPL:LOCAL.L_hk[0].mischer'],
			['HK2 Mischer', 'CAPPL:LOCAL.L_hk[1].mischer'],
			['PE1 Motor ES', 'CAPPL:FA[0].ausgang_motor[11]'],
			['PE2 Motor ES', 'CAPPL:FA[1].ausgang_motor[11]'],
			['PE1 Motor AV', 'CAPPL:FA[0].ausgang_motor[2]'],
			['PE1 Motor MA', 'CAPPL:FA[0].ausgang_motor[4]'],
			['PE1 CAP RA', 'CAPPL:FA[0].L_kap_sensor_raumentnahme'],
			['PE1 CAP ZB', 'CAPPL:FA[0].L_kap_sensor_zwischenbehaelter'],
			['PE1 AK', 'CAPPL:FA[0].L_alterkessel'],
			['PE1 Saug-Int[min]', 'CAPPL:FA[0].L_saugintervall'],
			['PE1 Fuellstand[kg]', 'CAPPL:FA[0].L_fuellstand_aktuell'],
			['PE1 Fuellstand ZWB[kg]', 'CAPPL:FA[0].L_zwischenbehaelter_aktuell']
		];
		const execute = vi.fn().mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);
		const query = vi.fn().mockResolvedValueOnce([baseColumns, []]).mockResolvedValueOnce([[], []]).mockResolvedValue([{}, []]);

		await createCsvMappingRepository({ execute, query } as never)
			.update(`Datum;Zeit;${mappings.map(([name]) => name).join(';')};`, language, 'create');

		const values = execute.mock.calls[1][1];
		for (const [index, [name, boiler]] of mappings.entries()) {
			expect(values[index * 6]).not.toBe(name);
			expect(values[index * 6 + 3]).toBe(name);
			expect(values[index * 6 + 5]).toBe(boiler);
		}
	});

	it('réordonne, réactive, désactive et ajoute sans modifier les colonnes historiques', async () => {
		const sensors = [
			sensor(1, 'AT [°C]', 2, 2, 'tc_ext'),
			sensor(2, 'absent', 3, 3),
			sensor(3, 'retour', -1, 4),
			sensor(4, 'Start Cycle', 4, 5, 'startCycle')
		];
		const execute = vi.fn().mockResolvedValueOnce([sensors, []]).mockResolvedValue([{}, []]);
		const query = vi.fn().mockResolvedValueOnce([[...baseColumns, ...[2, 3, 4, 5].map((n) => ({ Field: `col_${n}` }))], []])
			.mockResolvedValue([{}, []]);
		await createCsvMappingRepository({ execute, query } as never)
			.update('Datum;Zeit;retour;AT [°C];nouveau;', 'fr', 'update');

		expect(query.mock.calls[1][0]).toContain('ADD COLUMN `col_6`');
		expect(execute.mock.calls[1][1]).toEqual(['nouveau', 4, 6, 'nouveau', '', '']);
		expect(execute.mock.calls[2][1]).toEqual([3, 2, 1, 3, 4, 5, 2, -1, 3, 1, 4, 2]);
		expect(execute.mock.calls[2][0]).not.toContain('column_oko');
	});

	it.each(['Datum;Zeit;A;A;', 'Datum;Zeit;;A;', '<html>;', 'wrong;header;A;', 'Datum;Zeit;Start Cycle;'])(
		'refuse un en-tête invalide avant toute écriture : %s', async (header) => {
			const execute = vi.fn();
			const query = vi.fn();
			await expect(createCsvMappingRepository({ execute, query } as never).update(header, 'fr', 'create')).rejects.toThrow();
			expect(execute).not.toHaveBeenCalled();
			expect(query).not.toHaveBeenCalled();
		}
	);

	it('refuse une colonne orpheline ou un changement concurrent de mode', async () => {
		const execute = vi.fn().mockResolvedValue([[], []]);
		const query = vi.fn().mockResolvedValue([[...baseColumns, { Field: 'col_2' }], []]);
		const repository = createCsvMappingRepository({ execute, query } as never);
		await expect(repository.update('Datum;Zeit;A;', 'fr', 'create')).rejects.toThrow('Unmapped history column');
		await expect(repository.update('Datum;Zeit;A;', 'fr', 'update')).rejects.toThrow('Matrix state changed');
		expect(execute).toHaveBeenCalledTimes(2);
		expect(query).toHaveBeenCalledTimes(1);
	});

	it('traite les fins de ligne et les en-têtes sans point-virgule final', () => {
		expect(parseCsvHeader('Datum;Zeit;AT [°C]\n')).toEqual(['Datum', 'Zeit', 'AT [°C]']);
	});
});

describe('page matrice CSV', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('propose la création seulement si la matrice est vide et la mise à jour sinon', () => {
		const page = (sensors: CsvSensor[], loadError = false) => render(CsvMappingPage, {
			props: { params: {}, form: null, data: { language: 'fr', member: null, pathname: '/private/administration/csv-mapping', sensors, loadError } }
		}).body;
		expect(page([])).toContain('Créer la matrice');
		expect(page([sensor(1, 'AT [°C]', 2, 2)])).toContain('Mettre à jour');
		expect(page([sensor(1, 'AT [°C]', 2, 2)])).toContain('AT [°C]');
		expect(page([], true)).not.toContain('<form');
	});

	it('affiche la matrice active avec le rendu partagé et le formulaire de mise à jour avant le tableau', () => {
		const { body } = render(CsvMappingPage, {
			props: {
				params: {}, form: null,
				data: {
					language: 'fr', member: null, pathname: '/private/administration/csv-mapping',
					sensors: [sensor(1, 'AT [°C]', 2, 2), sensor(2, 'Capteur retiré', -1, 3)],
					loadError: false
				}
			}
		});

		expect(body).toContain('class="csv-mapping-actions"');
		expect(body).toContain('name="mode" value="update"');
		expect(body).toContain('class="reports-table seasons-table"');
		expect(body.indexOf('<form')).toBeLessThan(body.indexOf('<table'));
		expect(body).toContain('AT [°C]');
		expect(body).not.toContain('Capteur retiré');
	});

	it('affiche un cartouche de succès ou une alerte en cas d’échec', () => {
		const page = (form: { success: true } | { error: string }, loadError = false) => render(CsvMappingPage, {
			props: {
				params: {}, form,
				data: {
					language: 'fr', member: null, pathname: '/private/administration/csv-mapping',
					sensors: [sensor(1, 'AT [°C]', 2, 2)], loadError
				}
			}
		}).body;

		expect(page({ success: true })).toContain('<p class="reports-alert reports-alert-success" role="status">La matrice a été enregistrée.</p>');
		expect(page({ error: 'Échec de la mise à jour.' })).toContain('<p class="reports-alert" role="alert">Échec de la mise à jour.</p>');
		expect(page({ success: true }, true)).toContain('<p class="reports-alert" role="alert">Impossible de charger la matrice.</p>');
		for (const [form, role] of [[{ success: true } as const, 'status'], [{ error: 'Échec de la mise à jour.' }, 'alert']] as const) {
			const body = page(form);
			const actions = body.indexOf('class="csv-mapping-actions"');
			const feedback = body.indexOf(`role="${role}"`);
			expect(body.indexOf('La mise à jour utilise')).toBeLessThan(actions);
			expect(feedback).toBeGreaterThan(actions);
			expect(feedback).toBeLessThan(body.indexOf('<form'));
		}
	});

	it('télécharge le fichier du jour dans le fuseau configuré puis écrit sous verrou', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-14T23:30:00Z'));
		try {
			mocks.readConfiguration.mockResolvedValue({ timezone: 'Europe/Paris' });
			mocks.parseBoilerAddress.mockReturnValue('http://boiler.local');
			mocks.importFile.mockResolvedValue('Datum;Zeit;A;');
			mocks.withWriteLock.mockImplementation(async (_signal, callback) => callback('locked', new AbortController().signal));
			const request = new Request('http://localhost', {
				method: 'POST', body: new URLSearchParams({ mode: 'update' })
			});
			const result = await actions.default!({ request, locals: { language: 'fr', member: { id: 1 } } } as never);
			expect(result).toEqual({ success: true });
			expect(mocks.importFile).toHaveBeenCalledWith('http://boiler.local', 'touch_20261115.csv');
			expect(mocks.update).toHaveBeenCalledWith('Datum;Zeit;A;', 'fr', 'update');
		} finally {
			vi.useRealTimers();
		}
	});

	it('ne modifie pas la base si le fichier du jour est inaccessible', async () => {
		mocks.readConfiguration.mockResolvedValue({ timezone: 'Europe/Paris' });
		mocks.parseBoilerAddress.mockReturnValue('http://boiler.local');
		mocks.importFile.mockRejectedValue(new Error('missing'));
		const request = new Request('http://localhost', {
			method: 'POST', body: new URLSearchParams({ mode: 'create' })
		});
		const result = await actions.default!({ request, locals: { language: 'fr', member: { id: 1 } } } as never);
		expect(result).toMatchObject({ status: 500, data: { error: expect.any(String) } });
		expect(mocks.withWriteLock).not.toHaveBeenCalled();
	});

	it('indique explicitement quand le fichier du jour est absent', async () => {
		mocks.readConfiguration.mockResolvedValue({ timezone: 'Europe/Paris' });
		mocks.parseBoilerAddress.mockReturnValue('http://boiler.local');
		mocks.importFile.mockRejectedValue(new BoilerImportError('file-not-found'));
		const request = new Request('http://localhost', {
			method: 'POST', body: new URLSearchParams({ mode: 'create' })
		});
		const result = await actions.default!({ request, locals: { language: 'fr', member: { id: 1 } } } as never);
		expect(result).toMatchObject({ status: 404, data: { error: expect.stringContaining('introuvable') } });
		expect(mocks.withWriteLock).not.toHaveBeenCalled();
	});
});
