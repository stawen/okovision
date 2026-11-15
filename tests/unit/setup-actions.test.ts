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
		expect(body).toContain('placeholder="192.168.1.23"');
		expect(body).toContain('>Tester</button>');
		expect(body).toContain('name="initializeMatrix"');
		expect(body).toContain('L’initialisation de la matrice ne pourra pas se faire');
		expect(body).not.toContain('type="checkbox" name="initializeMatrix"');
		expect(body).toContain('aria-describedby="tcRef-help"');
		expect(body).toContain('aria-describedby="poidsPellet-help"');
		expect(body).not.toContain('Visualiser les fichiers CSV sur la chaudière');
		expect(body).not.toContain('getDataFromChaudiere');
		expect(body).not.toContain('sendToWeb');
		expect(body).not.toContain('name="lang"');
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
