import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { actions, load } from '../../src/routes/private/administration/settings/+page.server';
import SettingsPage from '../../src/routes/private/administration/settings/+page.svelte';
import { configurationParameters } from '../../src/lib/configuration';
import { readConfiguration, saveConfiguration } from '../../src/lib/server/config';
import type { RequestEvent } from '../../src/routes/private/administration/settings/$types';

const { connection } = vi.hoisted(() => ({ connection: {} }));
vi.mock('../../src/lib/server/collection', () => ({
	withWriteLock: (_signal: AbortSignal, run: (db: object, signal: AbortSignal) => Promise<unknown>) =>
		run(connection, new AbortController().signal)
}));
vi.mock('../../src/lib/server/repositories/energy', () => ({
	createEnergyRepository: () => ({ mutate: (_signal: AbortSignal, mutation: () => Promise<unknown>) => mutation() })
}));
vi.mock('../../src/lib/server/config', async (importOriginal) => ({
	...await importOriginal<typeof import('../../src/lib/server/config')>(),
	readConfiguration: vi.fn(),
	saveConfiguration: vi.fn()
}));

const values = {
	chaudiere: '192.168.1.23',
	tcRef: '20',
	poidsPellet: '150',
	surfaceMaison: '120',
	timezone: 'Europe/Paris',
	hasSilo: '0',
	siloSize: '',
	ashtray: '',
	pciPellet: '4.90',
	rendementChaudiere: '89.50'
};

function formData(overrides: Record<string, string> = {}): FormData {
	const form = new FormData();
	for (const [key, value] of Object.entries({ ...values, ...overrides })) form.set(key, value);
	return form;
}

function event(member: App.Locals['member'], form = formData()): RequestEvent {
	return {
		request: new Request('http://localhost/private/administration/settings', {
			method: 'POST',
			body: form
		}),
		locals: { language: 'fr', member }
	} as RequestEvent;
}

function loadEvent(member: App.Locals['member']): Parameters<typeof load>[0] {
	return {
		...event(member),
		parent: async () => ({ language: 'fr', member, pathname: '/private/administration/settings' }),
		depends: vi.fn(),
		untrack: (fn) => fn()
	} as Parameters<typeof load>[0];
}

describe('paramètres d’administration', () => {
	afterEach(() => vi.clearAllMocks());

	it('charge la configuration pour un administrateur et refuse les autres membres', async () => {
		vi.mocked(readConfiguration).mockResolvedValue(values);
		await expect(load(loadEvent({ id: 1, name: 'admin', type: 'admin' })))
			.resolves.toMatchObject({ language: 'fr', values });
		await expect(load(loadEvent({ id: 2, name: 'member', type: 'member' })))
			.rejects.toMatchObject({ status: 403 });
	});

	it('affiche les champs de configuration sans les contrôles destructifs du setup', () => {
		const { body } = render(SettingsPage, {
			props: {
				params: {},
				form: null,
				data: {
					language: 'fr',
					member: null,
					pathname: '/private/administration/settings',
					values
				}
			}
		});

		for (const param of configurationParameters) expect(body).toContain(`name="${param}"`);
		expect(body).toContain('Enregistrer la configuration');
		expect(body).not.toContain('Configuration de la communication chaudière');
		expect(body).toContain('>Tester</button>');
		expect(body).toContain('aria-describedby="tcRef-help"');
		expect(body).toContain('aria-describedby="ashtray-help"');
		expect(body).not.toContain('Visualiser les fichiers CSV sur la chaudière');
		expect(body).not.toContain('adminPassword');
		expect(body).not.toContain('forceConfirmation');
	});

	it('affiche les valeurs énergétiques enregistrées sans les remplacer par les valeurs initiales', () => {
		const { body } = render(SettingsPage, {
			props: {
				params: {}, form: null,
				data: {
					language: 'fr', member: null, pathname: '/private/administration/settings',
					values: { ...values, pciPellet: '4.30', rendementChaudiere: '85' }
				}
			}
		});
		expect(body).toMatch(/name="pciPellet"[^>]*value="4\.30"/);
		expect(body).toMatch(/name="rendementChaudiere"[^>]*value="85"/);
	});

	it('valide puis enregistre les paramètres sous le verrou partagé', async () => {
		vi.mocked(saveConfiguration).mockResolvedValue();

		await expect(actions.default(event({ id: 1, name: 'admin', type: 'admin' })))
			.resolves.toMatchObject({ success: true, values });
		expect(saveConfiguration).toHaveBeenCalledWith(connection, expect.objectContaining(values));
	});

	it.each(['fr', 'en'] as const)('regroupe les champs avec des aides repliées en %s', (language) => {
		const { body } = render(SettingsPage, {
			props: {
				params: {}, form: null,
				data: { language, member: null, pathname: '/private/administration/settings', values }
			}
		});
		const sections = [...body.matchAll(/<fieldset[^>]*>([\s\S]*?)<\/fieldset>/g)].map((match) => match[1]);
		expect(sections).toHaveLength(2);
		for (const param of ['chaudiere', 'tcRef', 'surfaceMaison', 'timezone']) {
			expect(sections[0]).toContain(`name="${param}"`);
			expect(sections[1]).not.toContain(`name="${param}"`);
		}
		for (const param of ['poidsPellet', 'hasSilo', 'siloSize', 'ashtray', 'pciPellet', 'rendementChaudiere']) {
			expect(sections[1]).toContain(`name="${param}"`);
			expect(sections[0]).not.toContain(`name="${param}"`);
		}
		const help = [...body.matchAll(/<details[^>]*>[\s\S]*?<\/details>/g)].map((match) => match[0]);
		expect(help).toHaveLength(2);
		expect(help.every((details) => !/<details[^>]*\sopen(?:\s|=|>)/.test(details))).toBe(true);
		expect(help[0]).toContain(language === 'fr' ? 'Plus d’informations' : 'More information');
		for (const param of configurationParameters) {
			expect(help.join('')).toContain(`id="${param}-help"`);
			expect(body.match(new RegExp(`name="${param}"`, 'g'))).toHaveLength(1);
		}
		const visible = body.replace(/<details[^>]*>[\s\S]*?<\/details>/g, '');
		expect(visible).toContain('id="siloSize-requirement"');
		expect(visible).not.toContain('id="tcRef-help"');
	});

	it.each(['', 'America/New_York', 'UTC', 'US/Eastern'])('sélectionne le fuseau configuré %j ou Paris par défaut', (timezone) => {
		const { body } = render(SettingsPage, {
			props: {
				params: {},
				form: null,
				data: {
					language: 'fr',
					member: null,
					pathname: '/private/administration/settings',
					values: { ...values, timezone }
				}
			}
		});
		const select = body.match(/<select id="timezone"[^>]*>[\s\S]*?<\/select>/)?.[0];
		expect(select).toContain(`value="${timezone || 'Europe/Paris'}" selected`);
		for (const zone of [...Intl.supportedValuesOf('timeZone'), 'UTC']) {
			expect(select).toContain(`value="${zone}"`);
		}
	});

	it.each(['0', '1'])('affiche la capacité uniquement pour le mode silo (hasSilo=%s)', (hasSilo) => {
		const { body } = render(SettingsPage, {
			props: {
				params: {}, form: null,
				data: { language: 'fr', member: null, pathname: '/private/administration/settings', values: { ...values, hasSilo, siloSize: '6200' } }
			}
		});
		expect(body).toContain('Mode de chargement des pellets :');
		expect(body).toContain('Utilisation de sacs');
		expect(body).toContain('Présence d’un silo');
		const capacityField = body.match(/<div class="field[^"]*"[^>]*><label for="siloSize"[\s\S]*?<\/div>/)?.[0];
		expect(capacityField).toBeDefined();
		const input = capacityField?.match(/<input id="siloSize"[^>]*>/)?.[0];
		expect(input).toContain('value="6200"');
		if (hasSilo === '0') {
			expect(capacityField).toMatch(/^<div[^>]*\shidden(?:=|\s|>)/);
			expect(input).not.toMatch(/\srequired(?:=|\s|>)/);
		} else {
			expect(capacityField).not.toMatch(/^<div[^>]*\shidden(?:=|\s|>)/);
			expect(input).toMatch(/\srequired(?:=|\s|>)/);
		}
	});

	it('refuse les valeurs invalides sans écrire en base', async () => {
		const result = await actions.default(event(
			{ id: 1, name: 'admin', type: 'admin' },
			formData({ tcRef: 'incorrect' })
		));
		expect(result).toMatchObject({ status: 400 });
		expect(saveConfiguration).not.toHaveBeenCalled();
	});
});
