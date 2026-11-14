import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBoilerConnector, getBoilerIndicators } from '../../src/lib/server/boiler';

const mocks = vi.hoisted(() => ({ readBoilerAddress: vi.fn(), getAdminBoilerCredentials: vi.fn() }));
vi.mock('../../src/lib/server/config', () => ({ readBoilerAddress: mocks.readBoilerAddress }));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({ users: { getAdminBoilerCredentials: mocks.getAdminBoilerCredentials } })
}));

const credentials = { username: 'boiler-user', password: 'boiler-password' };
const address = 'http://boiler.local:8180';

describe('connecteur chaudière Ökofen en lecture seule', () => {
	let fetcher: ReturnType<typeof vi.fn<typeof fetch>>;

	beforeEach(() => {
		fetcher = vi.fn<typeof fetch>();
		mocks.readBoilerAddress.mockResolvedValue(address);
		mocks.getAdminBoilerCredentials.mockReset();
		mocks.getAdminBoilerCredentials.mockResolvedValue(credentials);
	});

	it('utilise les identifiants chaudière décodés par le dépôt du compte admin', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=standard-account; Path=/' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: '3', unitText: '', formatTexts: '' }
			]), { status: 200 }));
		vi.stubGlobal('fetch', fetcher);
		try {
			const result = await getBoilerIndicators(1);
			const login = new URLSearchParams(String(fetcher.mock.calls[0][1]?.body));
			expect(login.get('username')).toBe(credentials.username);
			expect(login.get('password')).toBe(credentials.password);
			expect(result.readings.burnerStarts).toEqual({ value: 3, unit: '' });
			expect(mocks.getAdminBoilerCredentials).toHaveBeenCalledExactlyOnceWith();
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('signale les identifiants absents sans tenter un compte par défaut', async () => {
		mocks.getAdminBoilerCredentials.mockResolvedValue(null);
		await expect(getBoilerIndicators(1)).rejects.toMatchObject({ code: 'credentials' });
	});

	it('distingue une erreur de chargement des identifiants d’une erreur réseau chaudière', async () => {
		const cause = new Error('database unavailable');
		mocks.getAdminBoilerCredentials.mockRejectedValue(cause);
		await expect(getBoilerIndicators(1)).rejects.toMatchObject({ code: 'database', cause });
	});

	it('ouvre une session, demande les capteurs et normalise les valeurs comme le legacy', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=session-1; Path=/; HttpOnly' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{
					name: 'CAPPL:FA[0].L_mittlere_laufzeit',
					value: '120',
					divisor: '2',
					unitText: 's',
					formatTexts: ''
				},
				{
					name: 'CAPPL:LOCAL.touch[0].version',
					value: '1',
					divisor: '???',
					unitText: '???',
					formatTexts: 'V1|V2'
				},
				{
					name: 'CAPPL:LOCAL.L_hk[0].raumtemp_ist',
					value: '215',
					divisor: '10',
					unitText: 'K',
					formatTexts: ''
				}
			]), { status: 200 }));

		const result = await createBoilerConnector(fetcher).getIndicators(address, credentials, 1);
		expect(result.circuit).toBe(1);
		expect(result.readings.averageBurnerRunTime).toEqual({ value: 60, unit: 's' });
		expect(result.readings.controllerVersion).toEqual({ value: 'V2', unit: '' });
		expect(result.readings.roomTemperature).toEqual({ value: 21.5, unit: '°C' });
		expect(result.readings.burnerStarts).toEqual({ value: null, unit: '' });

		const [loginUrl, loginInit] = fetcher.mock.calls[0];
		expect(String(loginUrl)).toBe(`${address}/index.cgi`);
		expect(String(loginInit?.body)).toContain('username=boiler-user');
		expect(String(loginInit?.body)).toContain('password=boiler-password');
		const [readUrl, readInit] = fetcher.mock.calls[1];
		expect(String(readUrl)).toBe(`${address}/index.cgi?action=get&attr=1`);
		expect(readInit?.headers).toMatchObject({ cookie: 'sid=session-1' });
		expect(JSON.parse(String(readInit?.body))).toContain('CAPPL:LOCAL.L_fernwartung_datum_zeit_sek');
		expect(JSON.parse(String(readInit?.body))).toContain('CAPPL:LOCAL.L_hk[0].raumtemp_soll');
	});

	it('accepte une version textuelle sans rejeter les autres mesures', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=session-1; Path=/' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:LOCAL.touch[0].version', value: 'V4.0.1', divisor: '???', unitText: '???', formatTexts: '' },
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: '42', divisor: '1', unitText: '', formatTexts: '' }
			]), { status: 200 }));

		const result = await createBoilerConnector(fetcher).getIndicators(address, credentials, 1);
		expect(result.readings.controllerVersion).toEqual({ value: 'V4.0.1', unit: '' });
		expect(result.readings.burnerStarts).toEqual({ value: 42, unit: '' });
	});

	it('rejette une valeur non numérique pour un indicateur numérique', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=session-1; Path=/' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: 'invalid', unitText: '', formatTexts: '' }
			]), { status: 200 }));

		await expect(createBoilerConnector(fetcher).getIndicators(address, credentials, 1))
			.rejects.toMatchObject({ code: 'response' });
	});

	it('réutilise le cookie pour le relevé suivant', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=session-1; Path=/' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: '3', unitText: '', formatTexts: '' }
			]), { status: 200 }))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: '4', unitText: '', formatTexts: '' }
			]), { status: 200 }));

		const connector = createBoilerConnector(fetcher);
		await connector.getIndicators(address, credentials, 1);
		const next = await connector.getIndicators(address, credentials, 1);
		expect(next.readings.burnerStarts).toEqual({ value: 4, unit: '' });
		expect(fetcher).toHaveBeenCalledTimes(3);
	});

	it('ré-authentifie une session expirée même si le serveur renvoie une page de connexion 200', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=old; Path=/' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: '3', unitText: '', formatTexts: '' }
			]), { status: 200 }))
			.mockResolvedValueOnce(new Response('<html>login</html>', { status: 200 }))
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=new; Path=/' }
			}))
			.mockResolvedValueOnce(new Response(JSON.stringify([
				{ name: 'CAPPL:FA[0].L_brennerstarts', value: '4', unitText: '', formatTexts: '' }
			]), { status: 200 }));

		const connector = createBoilerConnector(fetcher);
		await connector.getIndicators(address, credentials, 1);
		await connector.getIndicators(address, credentials, 1);
		expect(fetcher).toHaveBeenCalledTimes(5);
		expect(fetcher.mock.calls[4][1]?.headers).toMatchObject({ cookie: 'sid=new' });
	});

	it('rejette une réponse chaudière invalide sans l’exposer comme une mesure', async () => {
		fetcher
			.mockResolvedValueOnce(new Response(null, {
				status: 303,
				headers: { 'set-cookie': 'sid=session-1; Path=/' }
			}))
			.mockResolvedValueOnce(new Response('not-json', { status: 200 }));

		await expect(createBoilerConnector(fetcher).getIndicators(address, credentials, 1))
			.rejects.toMatchObject({ code: 'response' });
	});
});
