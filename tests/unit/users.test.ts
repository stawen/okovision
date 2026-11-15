import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createUsersRepository, hashNewPassword } from '../../src/lib/server/repositories/users';

const hash = (value: string) => createHash('sha1').update(value).digest('hex');
const row = { id: 7, user: 'member', type: 'admin', pass: hash('test-password') };

describe('authentification MySQL historique en lecture seule', () => {
	it('authentifie le mot de passe choisi au setup sans accepter celui de démonstration', async () => {
		const pass = await hashNewPassword('installation-private-password');
		const execute = vi.fn().mockResolvedValue([[{ ...row, pass }]]);
		const users = createUsersRepository({ execute });
		await expect(users.authenticate('member', 'installation-private-password')).resolves.toEqual({
			id: 7, name: 'member', type: 'admin'
		});

		await expect(users.authenticate('member', 'okouser')).resolves.toBeNull();
	});
	it('utilise une requête paramétrée et ne retourne jamais le mot de passe', async () => {
		const execute = vi.fn().mockResolvedValue([[row]]);
		const users = createUsersRepository({ execute });
		await expect(users.authenticate("member' OR 1=1", 'test-password')).resolves.toEqual({
			id: 7, name: 'member', type: 'admin'
		});
		expect(execute).toHaveBeenCalledWith(
			'SELECT id, user, pass, type FROM oko_user WHERE user = ? LIMIT 2', ["member' OR 1=1"]
		);
	});

	it.each([
		[[], 'test-password'],
		[[row], 'wrong'],
		[[{ ...row, pass: 'invalid' }], 'test-password'],
		[[row, row], 'test-password']
	])('refuse un compte absent, incorrect, corrompu ou ambigu (%#)', async (rows, password) => {
		const execute = vi.fn().mockResolvedValue([rows]);
		await expect(createUsersRepository({ execute }).authenticate('member', password)).resolves.toBeNull();
	});

	it('reproduit les échappements mysqli avant SHA-1, y compris les caractères spéciaux', async () => {
		const password = "é'\u0000\n\r\\\"\u001a";
		const escaped = "é\\'\\0\\n\\r\\\\\\\"\\Z";
		const execute = vi.fn().mockResolvedValue([[{ ...row, pass: hash(escaped) }]]);
		await expect(createUsersRepository({ execute }).authenticate('member', password)).resolves.toEqual({
			id: 7, name: 'member', type: 'admin'
		});
	});

	it('laisse remonter les erreurs de base', async () => {
		const execute = vi.fn().mockRejectedValue(new Error('database unavailable'));
		await expect(createUsersRepository({ execute }).authenticate('member', 'test')).rejects.toThrow('database unavailable');
	});

	it('lit les identifiants chaudière encodés de la ligne admin sans les modifier', async () => {
		const execute = vi.fn().mockResolvedValue([[
			{ login: 'boiler-user', pass: Buffer.from('boiler-password').toString('base64') }
		]]);
		const users = createUsersRepository({ execute });
		await expect(users.getAdminBoilerCredentials()).resolves.toEqual({
			username: 'boiler-user',
			password: 'boiler-password'
		});
		expect(execute).toHaveBeenCalledWith(
			'SELECT login_boiler AS login, pass_boiler AS pass FROM oko_user WHERE user = ? LIMIT 2',
			['admin']
		);
	});

	it.each([
		{ rows: [] },
		{ rows: [{ login: null, pass: null }] },
		{ rows: [{ login: 'boiler-user', pass: 'not-base64' }] },
		{ rows: [{ login: 'boiler-user', pass: Buffer.from('').toString('base64') }] }
	])('retourne null si les identifiants admin sont absents ou invalides', async ({ rows }) => {
		const execute = vi.fn().mockResolvedValue([rows]);
		await expect(createUsersRepository({ execute }).getAdminBoilerCredentials()).resolves.toBeNull();
	});

	it('refuse plusieurs lignes admin', async () => {
		const row = { login: 'boiler-user', pass: Buffer.from('boiler-password').toString('base64') };
		const execute = vi.fn().mockResolvedValue([[row, row]]);
		await expect(createUsersRepository({ execute }).getAdminBoilerCredentials()).resolves.toBeNull();
	});
});

describe('changement du mot de passe', () => {
	it.each(['legacy', 'scrypt'])('vérifie le mot de passe %s et le remplace par un hash scrypt', async (kind) => {
		const stored = kind === 'legacy' ? row.pass : await hashNewPassword('test-password');
		const execute = vi.fn()
			.mockResolvedValueOnce([[{ ...row, pass: stored }]])
			.mockResolvedValueOnce([{ affectedRows: 1 }]);
		const users = createUsersRepository({ execute });
		await expect(users.changePassword(7, 'test-password', 'new-private-password')).resolves.toBe(true);
		expect(execute).toHaveBeenNthCalledWith(1, 'SELECT id, user, pass, type FROM oko_user WHERE id = ? LIMIT 2', [7]);
		const [sql, params] = execute.mock.calls[1];
		expect(sql).toBe('UPDATE oko_user SET pass = ? WHERE id = ? AND BINARY pass = BINARY ?');
		expect(params).toEqual([expect.stringMatching(/^scrypt\$/), 7, stored]);
		const authenticate = createUsersRepository({ execute: vi.fn().mockResolvedValue([[{ ...row, pass: params[0] }]]) });
		await expect(authenticate.authenticate('member', 'new-private-password')).resolves.toEqual({
			id: 7, name: 'member', type: 'admin'
		});
		await expect(authenticate.authenticate('member', 'test-password')).resolves.toBeNull();
	});

	it.each([
		{ rows: [], password: 'test-password' },
		{ rows: [row, row], password: 'test-password' },
		{ rows: [row], password: 'wrong' }
	])('refuse un compte absent, ambigu ou un mauvais mot de passe', async ({ rows, password }) => {
		const execute = vi.fn().mockResolvedValue([rows]);
		await expect(createUsersRepository({ execute }).changePassword(7, password, 'new-private-password')).resolves.toBe(false);
		expect(execute).toHaveBeenCalledTimes(1);
	});

	it('refuse une modification concurrente et propage les erreurs de base', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[row]]).mockResolvedValueOnce([{ affectedRows: 0 }]);
		await expect(createUsersRepository({ execute }).changePassword(7, 'test-password', 'new-private-password')).resolves.toBe(false);
		execute.mockRejectedValueOnce(new Error('database unavailable'));
		await expect(createUsersRepository({ execute }).changePassword(7, 'test-password', 'new-private-password')).rejects.toThrow('database unavailable');
	});
});
