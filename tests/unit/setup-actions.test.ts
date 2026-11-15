import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { actions, load } from '../../src/routes/setup/+page.server';
import SetupPage from '../../src/routes/setup/+page.svelte';
import { completeSetup, getSetupState, initializeSetupMatrix, SetupError } from '../../src/lib/server/setup';
import type { RequestEvent } from '../../src/routes/setup/$types';

vi.mock('../../src/lib/server/setup', async (importOriginal) => ({
	...await importOriginal<typeof import('../../src/lib/server/setup')>(),
	completeSetup: vi.fn(),
	getSetupState: vi.fn(),
	initializeSetupMatrix: vi.fn()
}));

function event(type?: string, testPassed = true) {
	const form = new FormData();
	for (const [param, value] of Object.entries({
		chaudiere: '192.168.1.23', tcRef: '20', poidsPellet: '150', surfaceMaison: '120',
		timezone: 'Europe/Paris', hasSilo: '0', siloSize: '', ashtray: '',
		adminPassword: 'setup-test-password', confirmPassword: 'setup-test-password',
		...(testPassed ? { initializeMatrix: 'yes' } : {})
	})) form.set(param, value);
	return {
		request: new Request('http://localhost/setup', { method: 'POST', body: form }),
		locals: { language: 'fr', member: type ? { id: 1, name: 'test', type } : null },
		getClientAddress: () => `setup-action-test-${type ?? 'anonymous'}`
	} as RequestEvent;
}

describe('setup sans jeton', () => {
	afterEach(() => vi.clearAllMocks());

	it('affiche le formulaire administrateur même si la table de configuration est absente', async () => {
		vi.mocked(getSetupState).mockResolvedValue({ status: 'configure', values: {} });
		await expect(load({
			...event('admin'), parent: async () => ({ language: 'fr', member: null, pathname: '/setup' }),
			depends: vi.fn(), untrack: (fn) => fn()
		})).resolves.toMatchObject({ status: 'configure', admin: true, values: {} });
	});

	it('affiche le formulaire initial sans champ de jeton', () => {
		const { body } = render(SetupPage, {
			props: {
				params: {}, form: null,
				data: { language: 'fr', member: null, pathname: '/setup', status: 'install', admin: false, values: {} }
			}
		});
		expect(body).toContain('name="adminPassword"');
		expect(body).not.toContain('name="setupToken"');
		expect(body).toContain('placeholder="ex: 192.168.1.23"');
		expect(body).toContain('>Tester</button>');
		expect(body).toContain('name="initializeMatrix"');
		expect(body).toContain('Un test de communication réussi est nécessaire');
		const submitButton = body.match(/<button[^>]*type="submit"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
		expect(submitButton).toContain('Installer et enregistrer');
		expect(submitButton).toContain('disabled');
		expect(body).not.toContain('type="checkbox" name="initializeMatrix"');
		expect(body).toContain('aria-describedby="tcRef-help"');
		expect(body).toContain('aria-describedby="poidsPellet-help"');
		expect(body).not.toContain('Visualiser les fichiers CSV sur la chaudière');
		expect(body).not.toContain('getDataFromChaudiere');
		expect(body).not.toContain('sendToWeb');
		expect(body).not.toContain('name="lang"');
		const siloSelect = body.match(/<select id="hasSilo"[^>]*>[\s\S]*?<\/select>/)?.[0];
		expect(siloSelect).toContain('<option value="1" selected');
		expect(body).toContain('Mode de chargement des pellets :');
		expect(siloSelect).toContain('Utilisation de sacs');
		expect(siloSelect).toContain('Présence d’un silo');
		const capacityField = body.match(/<div class="field[^"]*"[^>]*><label for="siloSize"[\s\S]*?<\/div>/)?.[0];
		expect(capacityField).toBeDefined();
		expect(capacityField).not.toMatch(/^<div[^>]*\shidden(?:=|\s|>)/);
		expect(capacityField?.match(/<input id="siloSize"[^>]*>/)?.[0]).toMatch(/\srequired(?:=|\s|>)/);
		const select = body.match(/<select id="timezone"[^>]*>[\s\S]*?<\/select>/)?.[0];
		expect(select).toContain('aria-describedby="timezone-help"');
		expect(select).toContain('required');
		expect(select).toContain('<option value="Europe/Paris" selected');
		for (const timezone of [...Intl.supportedValuesOf('timeZone'), 'UTC']) {
			expect(select).toContain(`value="${timezone}"`);
		}
		const sections = [...body.matchAll(/<fieldset[^>]*>([\s\S]*?)<\/fieldset>/g)].map((match) => match[1]);
		expect(sections).toHaveLength(2);
		expect(sections[0]).toContain('Installation</legend>');
		expect(sections[1]).toContain('Granulés et stockage</legend>');
		const help = [...body.matchAll(/<details[^>]*>[\s\S]*?<\/details>/g)].map((match) => match[0]);
		expect(help).toHaveLength(2);
		expect(help.every((details) => !/<details[^>]*\sopen(?:\s|=|>)/.test(details))).toBe(true);
		expect(help[0]).toContain('id="tcRef-help"');
		expect(help[1]).toContain('id="poidsPellet-help"');
		expect(body.replace(/<details[^>]*>[\s\S]*?<\/details>/g, '')).toContain('Capacité obligatoire si un silo est présent.');
		for (const example of ['20', '150', '120', '6000', '1000']) {
			expect(body).toContain(`placeholder="ex: ${example}"`);
			expect(body).not.toContain(`value="${example}"`);
		}
	});

	it.each(['fr', 'en'] as const)('distingue les exemples des valeurs configurées en %s', (language) => {
		const { body } = render(SetupPage, {
			props: {
				params: {}, form: null,
				data: {
					language, member: null, pathname: '/setup', status: 'configure', admin: true,
					values: { chaudiere: 'boiler.local', tcRef: '21' }
				}
			}
		});
		const submitButton = body.match(/<button[^>]*type="submit"[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
		expect(submitButton).toContain(language === 'fr' ? 'Enregistrer la configuration' : 'Save configuration');
		expect(submitButton).not.toContain('disabled');
		const prefix = language === 'fr' ? 'ex:' : 'e.g.:';
		const addressInput = body.match(/<input id="chaudiere"[^>]*>/)?.[0];
		expect(addressInput).toContain(`placeholder="${prefix} 192.168.1.23"`);
		expect(addressInput).toContain('value="boiler.local"');
		const temperatureInput = body.match(/<input id="tcRef"[^>]*>/)?.[0];
		expect(temperatureInput).toContain(`placeholder="${prefix} 20"`);
		expect(temperatureInput).toContain('value="21"');
	});

	it('conserve le fuseau et le mode sacs soumis après une erreur de validation', () => {
		const { body } = render(SetupPage, {
			props: {
				params: {},
				form: { values: { timezone: 'Asia/Tokyo', hasSilo: '0', siloSize: '6200' }, message: 'Valeurs invalides' },
				data: { language: 'fr', member: null, pathname: '/setup', status: 'configure', admin: true, values: { timezone: 'Europe/Paris', hasSilo: '1' } }
			}
		});
		const select = body.match(/<select id="timezone"[^>]*>[\s\S]*?<\/select>/)?.[0];
		expect(select).toContain('value="Asia/Tokyo" selected');
		expect(select).not.toContain('value="Europe/Paris" selected');
		const siloSelect = body.match(/<select id="hasSilo"[^>]*>[\s\S]*?<\/select>/)?.[0];
		expect(siloSelect).toContain('<option value="0" selected');
		const capacityField = body.match(/<div class="field[^"]*"[^>]*><label for="siloSize"[\s\S]*?<\/div>/)?.[0];
		expect(capacityField).toMatch(/^<div[^>]*\shidden(?:=|\s|>)/);
		const input = capacityField?.match(/<input id="siloSize"[^>]*>/)?.[0];
		expect(input).toContain('value="6200"');
		expect(input).not.toMatch(/\srequired(?:=|\s|>)/);
	});

	it('n’affiche ni le lien de connexion admin ni l’introduction supprimée', () => {
		const { body } = render(SetupPage, {
			props: {
				params: {}, form: null,
				data: { language: 'fr', member: null, pathname: '/setup', status: 'configure', admin: false, values: {} }
			}
		});
		expect(body).not.toContain('Connexion administrateur existant');
		expect(body).not.toContain('href="/login"');
		expect(body).not.toContain('Configurez votre installation.');
	});

	it('réserve la reprise de matrice aux administrateurs', () => {
		const page = (admin: boolean) => render(SetupPage, {
			props: {
				params: {}, form: null,
				data: { language: 'fr', member: null, pathname: '/setup', status: 'matrix', admin, values: {} }
			}
		}).body;
		expect(page(false)).toContain('href="/login"');
		expect(page(false)).not.toContain('retryMatrix');
		expect(page(true)).toContain('action="?/retryMatrix"');
	});

	it.each([undefined, 'admin'])('accepte le formulaire sans jeton, avec ou sans session (%s)', async (type) => {
		await expect(actions.save(event(type))).rejects.toMatchObject({ status: 303, location: '/' });
		expect(completeSetup).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ surfaceMaison: '120' }), 'setup-test-password', false
		);
		expect(initializeSetupMatrix).toHaveBeenCalledExactlyOnceWith('fr');
	});

	it('conserve la configuration enregistrée et bloque la collecte si la matrice échoue', async () => {
		vi.mocked(initializeSetupMatrix).mockRejectedValueOnce(new Error('connection failed'));
		await expect(actions.save(event())).resolves.toMatchObject({
			matrixPending: true, message: expect.stringContaining('collecte reste désactivée')
		});
		expect(completeSetup).toHaveBeenCalledOnce();
	});

	it('enregistre sans lancer la matrice si le test courant n’est pas positif', async () => {
		await expect(actions.save(event(undefined, false))).resolves.toMatchObject({
			matrixPending: true, message: expect.stringContaining('n’a pas validé')
		});
		expect(completeSetup).toHaveBeenCalledOnce();
		expect(initializeSetupMatrix).not.toHaveBeenCalled();
	});

	it('exige un administrateur pour relancer la matrice', async () => {
		await expect(actions.retryMatrix!({
			locals: { language: 'fr', member: null },
			getClientAddress: () => 'setup-retry-test'
		} as never)).resolves.toMatchObject({ status: 403 });
		expect(initializeSetupMatrix).not.toHaveBeenCalled();
	});

	it('permet à un administrateur de relancer la matrice', async () => {
		await expect(actions.retryMatrix!({
			locals: { language: 'fr', member: { id: 1, type: 'admin' } },
			getClientAddress: () => 'setup-retry-admin-test'
		} as never)).rejects.toMatchObject({ status: 303, location: '/' });
		expect(initializeSetupMatrix).toHaveBeenCalledExactlyOnceWith('fr');
	});

	it('conserve le refus de réinstallation une fois la configuration terminée', async () => {
		vi.mocked(completeSetup).mockRejectedValueOnce(new SetupError('complete'));
		await expect(actions.save(event())).resolves.toMatchObject({ status: 409 });
	});
});
