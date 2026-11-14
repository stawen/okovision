import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { actions, load } from '../../src/routes/setup/+page.server';
import SetupPage from '../../src/routes/setup/+page.svelte';
import { completeSetup, getSetupState, SetupError } from '../../src/lib/server/setup';
import type { RequestEvent } from '../../src/routes/setup/$types';

vi.mock('../../src/lib/server/setup', async (importOriginal) => ({
	...await importOriginal<typeof import('../../src/lib/server/setup')>(),
	completeSetup: vi.fn(),
	getSetupState: vi.fn()
}));

function event(type?: string) {
	const form = new FormData();
	for (const [param, value] of Object.entries({
		chaudiere: '192.168.1.23', tcRef: '20', poidsPellet: '150', surfaceMaison: '120',
		timezone: 'Europe/Paris', hasSilo: '0', siloSize: '', ashtray: '',
		adminPassword: 'setup-test-password', confirmPassword: 'setup-test-password'
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

	it.each([undefined, 'admin'])('accepte le formulaire sans jeton, avec ou sans session (%s)', async (type) => {
		await expect(actions.default(event(type))).rejects.toMatchObject({ status: 303, location: '/' });
		expect(completeSetup).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({ surfaceMaison: '120' }), 'setup-test-password', false
		);
	});

	it('conserve le refus de réinstallation une fois la configuration terminée', async () => {
		vi.mocked(completeSetup).mockRejectedValueOnce(new SetupError('complete'));
		await expect(actions.default(event())).resolves.toMatchObject({ status: 409 });
	});
});
