import { render } from 'svelte/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions } from '../../src/routes/private/account/+page.server';
import Account from '../../src/routes/private/account/+page.svelte';
import { createSession, getSession, revokeSession, sessionCookie } from '../../src/lib/server/auth';

const { changePassword, logError } = vi.hoisted(() => ({ changePassword: vi.fn(), logError: vi.fn() }));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({ users: { changePassword } })
}));
vi.mock('../../src/lib/server/logger', () => ({
	logger: { child: () => ({ error: logError, info: vi.fn() }) }
}));

const member = { id: 7, name: 'member', type: 'admin' };
const remove = vi.fn();
let sequence = 0;
const action = actions.default;
if (!action) throw new Error('Missing account action');
type AccountEvent = Parameters<NonNullable<typeof action>>[0];

function event(values: Record<string, string>, token?: string, authenticated = true): AccountEvent {
	const form = new FormData();
	for (const [key, value] of Object.entries(values)) form.set(key, value);
	const partial: Pick<AccountEvent, 'request' | 'locals' | 'cookies' | 'getClientAddress'> = {
		request: new Request('https://localhost/private/account', { method: 'POST', body: form }),
		locals: { language: 'fr', member: authenticated ? member : null },
		cookies: { get: () => token, getAll: () => [], set: vi.fn(), delete: remove, serialize: vi.fn(), parse: vi.fn() },
		getClientAddress: () => `account-test-${sequence++}`
	};
	return partial as AccountEvent;
}

const valid = { currentPassword: 'old-password', newPassword: 'new-password-123', confirmPassword: 'new-password-123' };

describe('changement de mot de passe du compte', () => {
	beforeEach(() => vi.resetAllMocks());

	it('affiche un formulaire accessible sans afficher les mots de passe soumis', () => {
		const { body, head } = render(Account, {
			props: { params: {}, form: { message: 'Erreur' }, data: { language: 'fr', member, pathname: '/private/account' } }
		});
		expect(body).toContain('>Changer mot de passe</h1>');
		expect(head).toContain('Changer mot de passe — OkoVision');
		expect(body).toContain('name="currentPassword"');
		expect(body).toContain('name="newPassword"');
		expect(body).toContain('name="confirmPassword"');
		expect(body).toContain('autocomplete="current-password"');
		expect(body).toContain('autocomplete="new-password"');
		expect(body).toContain('role="alert"');
		expect(body).not.toContain('value="old-password"');
	});

	it('redirige les visiteurs non connectés avant toute opération', async () => {
		await expect(action(event(valid, undefined, false))).rejects.toMatchObject({ status: 303, location: '/login' });
		expect(changePassword).not.toHaveBeenCalled();
	});

	it.each([
		{ ...valid, currentPassword: '' },
		{ ...valid, currentPassword: 'x'.repeat(1025) },
		{ ...valid, newPassword: 'short', confirmPassword: 'short' },
		{ ...valid, newPassword: 'x'.repeat(1025), confirmPassword: 'x'.repeat(1025) },
		{ ...valid, confirmPassword: 'different-password' }
	])('refuse les champs invalides avant la base', async (values) => {
		await expect(action(event(values))).resolves.toMatchObject({ status: 400 });
		expect(changePassword).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
	});

	it('conserve la session lorsque le mot de passe actuel est refusé ou la base indisponible', async () => {
		const token = createSession(member);
		try {
			changePassword.mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('private database details'));
			await expect(action(event(valid, token))).resolves.toMatchObject({ status: 400 });
			await expect(action(event(valid, token))).resolves.toMatchObject({ status: 503 });
			expect(logError).toHaveBeenCalledWith('passwordChangeFailed', expect.any(Error));
			expect(getSession(token)).toEqual(member);
			expect(remove).not.toHaveBeenCalled();
		} finally {
			revokeSession(token);
		}
	});

	it('révoque la session courante et redirige après enregistrement', async () => {
		const token = createSession(member);
		const other = createSession(member);
		try {
			changePassword.mockResolvedValue(true);
			await expect(action(event(valid, token))).rejects.toMatchObject({ status: 303, location: '/login' });
			expect(changePassword).toHaveBeenCalledWith(member.id, valid.currentPassword, valid.newPassword);
			expect(getSession(token)).toBeNull();
			expect(getSession(other)).toEqual(member);
			expect(remove).toHaveBeenCalledWith(sessionCookie, { path: '/' });
		} finally {
			revokeSession(token);
			revokeSession(other);
		}
	});

	it.each([12, 1024])('accepte un nouveau mot de passe de %i caractères', async (length) => {
		changePassword.mockResolvedValue(true);
		const password = 'x'.repeat(length);
		await expect(action(event({ ...valid, newPassword: password, confirmPassword: password })))
			.rejects.toMatchObject({ status: 303, location: '/login' });
		expect(changePassword).toHaveBeenCalledWith(member.id, valid.currentPassword, password);
	});

	it('limite les tentatives répétées depuis une adresse', async () => {
		changePassword.mockResolvedValue(false);
		const request = { ...event(valid), getClientAddress: () => 'account-rate-test' };
		for (let i = 0; i < 10; i++) {
			await expect(action({ ...request, request: request.request.clone() })).resolves.toMatchObject({ status: 400 });
		}
		await expect(action(request)).resolves.toMatchObject({ status: 429 });
		expect(changePassword).toHaveBeenCalledTimes(10);
	});
});
