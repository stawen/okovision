import { describe, expect, it, vi } from 'vitest';
import { testBoilerConnection } from '../../src/lib/boiler-address';

describe('test de connexion chaudière dans le navigateur', () => {
	it('affiche le lien du répertoire CSV après une réponse opaque, sans envoyer de cookies', async () => {
		const response = new Response();
		Object.defineProperty(response, 'type', { value: 'opaque' });
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response);

		await expect(testBoilerConnection('chaudiere.local:8180', fetcher)).resolves.toEqual({
			status: 'reachable',
			url: 'http://chaudiere.local:8180/logfiles/pelletronic/'
		});
		expect(fetcher).toHaveBeenCalledWith(
			'http://chaudiere.local:8180/logfiles/pelletronic/',
			expect.objectContaining({ mode: 'no-cors', credentials: 'omit', redirect: 'follow' })
		);
	});

	it('refuse une adresse invalide sans lancer de requête', async () => {
		const fetcher = vi.fn<typeof fetch>();
		await expect(testBoilerConnection('http://example.test/path', fetcher))
			.resolves.toEqual({ status: 'invalid' });
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('signale un échec réseau ou une réponse HTTP explicitement invalide', async () => {
		const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new TypeError('network'));
		fetcher.mockResolvedValueOnce(new Response(null, { status: 404 }));
		await expect(testBoilerConnection('192.168.1.23', fetcher)).resolves.toEqual({ status: 'unreachable' });
		await expect(testBoilerConnection('192.168.1.23', fetcher)).resolves.toEqual({ status: 'unreachable' });
	});
});
