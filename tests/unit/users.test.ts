import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createUsersRepository } from '../../src/lib/server/repositories/users';

const hash = (value: string) => createHash('sha1').update(value).digest('hex');
const row = { id: 7, user: 'member', type: 'admin', pass: hash('test-password') };

describe('authentification MySQL historique en lecture seule', () => {
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
