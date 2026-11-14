import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { actions, load } from '../../src/routes/private/administration/settings/+page.server';
import SettingsPage from '../../src/routes/private/administration/settings/+page.svelte';
import { configurationParameters } from '../../src/lib/configuration';
import { readConfiguration, saveConfiguration } from '../../src/lib/server/config';
import type { RequestEvent } from '../../src/routes/private/administration/settings/$types';

const { getConnection } = vi.hoisted(() => ({ getConnection: vi.fn() }));

vi.mock('../../src/lib/server/database', () => ({
	getDatabasePool: () => ({ getConnection })
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
	ashtray: ''
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
		expect(body).not.toContain('adminPassword');
		expect(body).not.toContain('forceConfirmation');
	});

	it('valide puis enregistre les paramètres dans une connexion transactionnelle', async () => {
		const connection = { release: vi.fn() };
		getConnection.mockResolvedValue(connection);
		vi.mocked(saveConfiguration).mockResolvedValue();

		await expect(actions.default(event({ id: 1, name: 'admin', type: 'admin' })))
			.resolves.toMatchObject({ success: true, values });
		expect(saveConfiguration).toHaveBeenCalledWith(connection, expect.objectContaining(values));
		expect(connection.release).toHaveBeenCalledOnce();
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
