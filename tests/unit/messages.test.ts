import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/server/environment', () => ({ loadServerEnvironment: vi.fn() }));

import { getMessages } from '../../src/lib/server/messages';

describe('langue des messages backend', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('utilise le français lorsque la langue est absente', () => {
		vi.stubEnv('APP_LANG', undefined);
		expect(getMessages().dbAddressRequired).toBe('DB_ADRESSE est obligatoire.');
	});

	it('accepte les codes FR et EN sans distinction de casse', () => {
		vi.stubEnv('APP_LANG', 'en');
		expect(getMessages().dbAddressRequired).toBe('DB_ADRESSE is required.');
		vi.stubEnv('APP_LANG', 'FR');
		expect(getMessages().dbAddressRequired).toBe('DB_ADRESSE est obligatoire.');
	});

	it('refuse une valeur vide ou inconnue', () => {
		for (const language of ['', 'DE']) {
			vi.stubEnv('APP_LANG', language);
			expect(() => getMessages()).toThrow('APP_LANG');
		}
	});
});
