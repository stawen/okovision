import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { actions } from '../../src/routes/login/+page.server';
import { POST } from '../../src/routes/private/logout/+server';
import { createSession, getSession, sessionCookie } from '../../src/lib/server/auth';

const { authenticate, logError, logInfo } = vi.hoisted(() => ({
	authenticate: vi.fn(), logError: vi.fn(), logInfo: vi.fn()
}));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({ users: { authenticate } })
}));
vi.mock('../../src/lib/server/logger', () => ({
	logger: { child: () => ({ error: logError, info: logInfo }) }
}));

const member = { id: 7, name: 'member', type: 'admin' };
const set = vi.fn();
const remove = vi.fn();
let sequence = 0;
const login = actions.default;
if (!login) throw new Error('Missing login action');
type LoginEvent = Parameters<NonNullable<typeof login>>[0];

function event(password: string, token?: string) {
	const form = new FormData();
	form.set('username', 'member');
	form.set('password', password);
	const partialEvent: Pick<LoginEvent, 'request' | 'url' | 'locals' | 'cookies' | 'getClientAddress'> = {
		request: new Request('https://localhost/login', { method: 'POST', body: form }),
		url: new URL('https://localhost/login'),
		locals: { language: 'fr', member: null },
		cookies: { get: () => token, getAll: () => [], set, delete: remove, serialize: vi.fn(), parse: vi.fn() },
		getClientAddress: () => `login-test-${sequence++}`
	};
	return partialEvent as LoginEvent;
}

describe('connexion et déconnexion', () => {
	beforeEach(() => vi.resetAllMocks());
	afterEach(() => vi.restoreAllMocks());

	it('refuse les identifiants invalides sans créer de cookie', async () => {
		authenticate.mockResolvedValue(null);
		await expect(login(event('wrong'))).resolves.toMatchObject({
			status: 400, data: { message: 'Identifiant ou mot de passe incorrect.' }
		});
		expect(set).not.toHaveBeenCalled();
	});

	it('refuse une saisie vide avant toute requête MySQL', async () => {
		await expect(login(event(''))).resolves.toMatchObject({ status: 400 });
		expect(authenticate).not.toHaveBeenCalled();
		expect(set).not.toHaveBeenCalled();
	});

	it('signale une panne sans exposer de détails internes', async () => {
		authenticate.mockRejectedValue(new Error('private database details'));
		await expect(login(event('test'))).resolves.toMatchObject({
			status: 503, data: { message: 'La connexion est momentanément indisponible. Réessayez plus tard.' }
		});
		expect(logError).toHaveBeenCalledWith('loginFailed', expect.any(Error));
		expect(set).not.toHaveBeenCalled();
	});

	it('crée une session HttpOnly, remplace la précédente et la révoque à la déconnexion', async () => {
		authenticate.mockResolvedValue(member);
		const previous = createSession(member);
		await expect(login(event('test', previous))).rejects.toMatchObject({ status: 303, location: '/' });
		expect(getSession(previous)).toBeNull();
		expect(set).toHaveBeenCalledWith(sessionCookie, expect.any(String), {
			path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 28800
		});
		const token: string = set.mock.calls[0][1];
		expect(getSession(token)).toEqual(member);
		await expect(Promise.resolve().then(() => POST({ ...event('unused', token), route: { id: '/private/logout' } }))).rejects.toMatchObject({ status: 303, location: '/' });
		expect(getSession(token)).toBeNull();
		expect(remove).toHaveBeenCalledWith(sessionCookie, { path: '/' });
	});

	it('limite les appels au repository après dix soumissions depuis la même adresse', async () => {
		authenticate.mockResolvedValue(null);
		const request = { ...event('wrong'), getClientAddress: () => 'login-rate-test' };
		for (let i = 0; i < 10; i++) {
			await expect(login({ ...request, request: request.request.clone() })).resolves.toMatchObject({ status: 400 });
		}
		await expect(login(request)).resolves.toMatchObject({ status: 429 });
		expect(authenticate).toHaveBeenCalledTimes(10);
		expect(set).not.toHaveBeenCalled();
	});
});
