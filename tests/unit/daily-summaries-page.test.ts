import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import type { RequestEvent } from '../../src/routes/private/configuration/daily-summaries/$types';
import { actions, load } from '../../src/routes/private/configuration/daily-summaries/+page.server';
import Page from '../../src/routes/private/configuration/daily-summaries/+page.svelte';
import { summaryDays } from '../../src/lib/ui/daily-summaries';
import { readCollectionConfig } from '../../src/lib/server/config';
import { withWriteLock } from '../../src/lib/server/collection';
import { DailySummaryNoDataError } from '../../src/lib/server/repositories/daily-summary';

const { save, energyStatus, energyCalculate, energyRebuild } = vi.hoisted(() => ({
	save: vi.fn(), energyStatus: vi.fn(), energyCalculate: vi.fn(), energyRebuild: vi.fn()
}));
vi.mock('../../src/lib/server/config', () => ({ readCollectionConfig: vi.fn() }));
vi.mock('../../src/lib/server/collection', () => ({ withWriteLock: vi.fn() }));
vi.mock('../../src/lib/server/repositories/energy', () => ({
	createEnergyRepository: () => ({
		mutate: (_signal: AbortSignal, mutation: () => Promise<unknown>) => mutation(),
		status: energyStatus, calculate: energyCalculate, rebuild: energyRebuild
	})
}));
vi.mock('../../src/lib/server/repositories/daily-summary', async (importOriginal) => ({
	...await importOriginal<typeof import('../../src/lib/server/repositories/daily-summary')>(),
	createDailySummaryRepository: () => ({ save })
}));

function event(day: string, member: App.Locals['member'] = { id: 1, name: 'member', type: 'member' }): RequestEvent {
	const body = new FormData();
	body.set('day', day);
	return {
		request: new Request('http://localhost/private/configuration/daily-summaries?/recalculate', { method: 'POST', body }),
		locals: { language: 'fr', member }
	} as RequestEvent;
}

function loadEvent(): Parameters<typeof load>[0] {
	return {
		...event('2026-11-14'),
		parent: async () => ({
			language: 'fr',
			member: null,
			pathname: '/private/configuration/daily-summaries'
		}),
		depends: vi.fn(),
		untrack: (fn) => fn()
	};
}

describe('période des synthèses journalières', () => {
	it('inclut toutes les dates dans l’ordre, même sans relevés et autour des changements d’heure', () => {
		expect(summaryDays('2026-03-28', '2026-03-30', '2026-11-14'))
			.toEqual(['2026-03-28', '2026-03-29', '2026-03-30']);
		expect(summaryDays('2024-02-28', '2024-03-01', '2026-11-14'))
			.toEqual(['2024-02-28', '2024-02-29', '2024-03-01']);
		expect(summaryDays('2026-11-14', '2026-11-14', '2026-11-14')).toEqual(['2026-11-14']);
	});

	it.each([
		['', '2026-11-14'],
		['2025-02-29', '2025-03-01'],
		['2026-11-14', '2026-11-13'],
		['2026-11-14', '2026-11-15']
	])('refuse une période invalide %s — %s', (start, end) => {
		expect(summaryDays(start, end, '2026-11-14')).toBeNull();
	});

	it('affiche les dates, le tableau et les actions sans présenter un calcul fictif comme réussi', () => {
		const { body } = render(Page, {
			props: {
				params: {}, form: null,
				data: {
					language: 'fr', member: null,
					pathname: '/private/configuration/daily-summaries',
					latestDay: '2026-11-14', loadError: false
				}
			}
		});
		expect(body).toContain('Date de début');
		expect(body).toContain('Date de fin');
		expect(body).toContain('max="2026-11-14"');
		expect(body).toContain('Tout recalculer');
		expect(body).toContain('Sélectionnez une période');
		expect(body).not.toContain('Toutes les journées sélectionnées ont été recalculées.');
		expect(body).not.toContain('fonctionnalités ne sont pas encore disponibles');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});
});

describe('recalcul serveur des synthèses', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-14T23:30:00Z'));
		vi.mocked(readCollectionConfig).mockResolvedValue({
			boilerAddress: 'http://boiler.test', poidsPellet: 150, tcRef: 20,
			timezone: 'Europe/Paris', ashtray: null
		});
		vi.mocked(withWriteLock).mockImplementation(async (signal, run) => run({} as never, signal));
		save.mockResolvedValue('saved');
		energyStatus.mockResolvedValue('dirty');
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.resetAllMocks();
		vi.restoreAllMocks();
	});

	it('limite la sélection à hier dans le fuseau de l’installation', async () => {
		await expect(load(loadEvent()))
			.resolves.toMatchObject({ latestDay: '2026-11-14', loadError: false });
	});

	it('force une écriture réelle avec la configuration courante sous le verrou partagé', async () => {
		const request = event('2026-11-13');
		await expect(actions.recalculate(request)).resolves.toEqual({ day: '2026-11-13' });
		expect(withWriteLock).toHaveBeenCalledWith(request.request.signal, expect.any(Function));
		expect(save).toHaveBeenCalledWith('2026-11-13', '2026-11-15', true, 150, 20);
	});

	it.each(['2025-02-29', '2026-11-15', '2026-11-16'])('refuse la date %s sans écrire', async (day) => {
		await expect(actions.recalculate(event(day))).resolves.toMatchObject({ status: 400 });
		expect(withWriteLock).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
	});

	it('refuse les visiteurs anonymes sans accès à la base', async () => {
		await expect(actions.recalculate(event('2026-11-13', null))).resolves.toMatchObject({ status: 403 });
		expect(readCollectionConfig).not.toHaveBeenCalled();
		expect(save).not.toHaveBeenCalled();
	});

	it.each(['skipped', new Error('Missing startCycle column')])('ne renvoie aucun succès si le calcul échoue : %s', async (result) => {
		if (result instanceof Error) save.mockRejectedValueOnce(result);
		else save.mockResolvedValueOnce(result);
		await expect(actions.recalculate(event('2026-11-13'))).resolves.toMatchObject({
			status: 500, data: { error: expect.stringContaining('Recalcul impossible') }
		});
		expect(console.error).toHaveBeenCalled();
	});

	it('renvoie le message dédié lorsqu’aucun détail journalier n’existe pour la date', async () => {
		save.mockRejectedValueOnce(new DailySummaryNoDataError('2026-11-13'));
		await expect(actions.recalculate(event('2026-11-13'))).resolves.toMatchObject({
			status: 422, data: { error: 'Aucune donnée journalière pour ce jour' }
		});
		expect(console.error).toHaveBeenCalled();
	});

	it('signale explicitement une configuration inaccessible', async () => {
		vi.mocked(readCollectionConfig).mockRejectedValueOnce(new Error('database unavailable'));
		await expect(load(loadEvent())).resolves.toMatchObject({ latestDay: '', loadError: true });
		expect(console.error).toHaveBeenCalled();
	});

	it('simule sans écrire puis exige une confirmation avant la reprise', async () => {
		const result = { summaries: [], parameters: { pci: 4.9, efficiency: 89.5 } };
		energyCalculate.mockResolvedValue(result);
		energyRebuild.mockResolvedValue(result);
		await expect(actions.energyPreview(event('2026-11-13'))).resolves.toMatchObject({
			energyReport: { saved: false, count: 0, parameters: result.parameters }
		});
		expect(energyRebuild).not.toHaveBeenCalled();
		await expect(actions.energyRecalculate(event('2026-11-13'))).resolves.toMatchObject({ status: 400 });
		const request = event('2026-11-13');
		const form = new FormData();
		form.set('confirmed', 'yes');
		const confirmed = { ...request, request: new Request(request.request.url, { method: 'POST', body: form }) };
		await expect(actions.energyRecalculate(confirmed)).resolves.toMatchObject({
			energyReport: { saved: true, count: 0 }
		});
		expect(energyRebuild).toHaveBeenCalledOnce();
	});

	it('refuse la simulation et la reprise avant migration', async () => {
		energyStatus.mockResolvedValue('unavailable');
		await expect(actions.energyPreview(event('2026-11-13'))).resolves.toMatchObject({ status: 422 });
		expect(energyCalculate).not.toHaveBeenCalled();
	});
});
