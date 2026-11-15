import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export type Member = { id: number; name: string; type: string };

interface UserRow extends RowDataPacket {
	id: number;
	user: string;
	pass: string;
	type: string;
}

interface BoilerCredentialsRow extends RowDataPacket {
	login: string | null;
	pass: string | null;
}

export interface BoilerCredentials {
	username: string;
	password: string;
}

// PHP hashes the mysqli-escaped password, not the original input.
function legacyPasswordHash(password: string): Buffer {
	const escapes: Record<string, string> = {
		'\0': '\\0', '\n': '\\n', '\r': '\\r', '\\': '\\\\',
		"'": "\\'", '"': '\\"', '\x1a': '\\Z'
	};
	return createHash('sha1').update(password.split('').map((char) => escapes[char] ?? char).join('')).digest();
}

function derivePassword(password: string, salt: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(password, salt, 64, (error, key) => {
			if (error) reject(error);
			else resolve(key);
		});
	});
}

export async function hashNewPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString('hex');
	const hash = await derivePassword(password, salt);
	return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function passwordMatches(password: string, stored: string | undefined): Promise<boolean> {
	const modern = stored?.match(/^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/);
	if (modern) {
		const hash = await derivePassword(password, modern[1]);
		return timingSafeEqual(hash, Buffer.from(modern[2], 'hex'));
	}
	const hash = legacyPasswordHash(password);
	const legacy = stored && /^[a-f0-9]{40}$/i.test(stored) ? Buffer.from(stored, 'hex') : Buffer.alloc(20);
	return timingSafeEqual(hash, legacy) && !!stored;
}

export function createUsersRepository(db: Pick<Pool, 'execute'>) {
	return {
		/** Existing PHP passwords remain compatible; newly installed accounts use scrypt. */
		async authenticate(name: string, password: string): Promise<Member | null> {
			const [rows] = await db.execute<UserRow[]>(
				'SELECT id, user, pass, type FROM oko_user WHERE user = ? LIMIT 2', [name]
			);
			const row = rows.length === 1 ? rows[0] : undefined;
			const matches = await passwordMatches(password, row?.pass);
			return row && matches ? { id: row.id, name: row.user, type: row.type } : null;
		},
		async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
			const [rows] = await db.execute<UserRow[]>(
				'SELECT id, user, pass, type FROM oko_user WHERE id = ? LIMIT 2', [id]
			);
			const row = rows.length === 1 ? rows[0] : undefined;
			if (!await passwordMatches(currentPassword, row?.pass) || !row) return false;
			const hash = await hashNewPassword(newPassword);
			const [result] = await db.execute<ResultSetHeader>(
				'UPDATE oko_user SET pass = ? WHERE id = ? AND BINARY pass = BINARY ?',
				[hash, id, row.pass]
			);
			return result.affectedRows === 1;
		},
		/** Decodes the legacy admin boiler password only when its base64 representation is canonical. */
		async getAdminBoilerCredentials(): Promise<BoilerCredentials | null> {
			const [rows] = await db.execute<BoilerCredentialsRow[]>(
				'SELECT login_boiler AS login, pass_boiler AS pass FROM oko_user WHERE user = ? LIMIT 2',
				['admin']
			);
			const row = rows.length === 1 ? rows[0] : undefined;
			if (!row || typeof row.login !== 'string' || !row.login.trim()
				|| typeof row.pass !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(row.pass)) {
				return null;
			}
			const decodedPassword = Buffer.from(row.pass, 'base64').toString('utf8');
			if (!decodedPassword || Buffer.from(decodedPassword, 'utf8').toString('base64') !== row.pass) return null;
			return { username: row.login, password: decodedPassword };
		}
	};
}
