import { createHash, timingSafeEqual } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';

export type Member = { id: number; name: string; type: string };

interface UserRow extends RowDataPacket {
	id: number;
	user: string;
	pass: string;
	type: string;
}

// PHP hashes the mysqli-escaped password, not the original input.
function legacyPasswordHash(password: string): Buffer {
	const escapes: Record<string, string> = {
		'\0': '\\0', '\n': '\\n', '\r': '\\r', '\\': '\\\\',
		"'": "\\'", '"': '\\"', '\x1a': '\\Z'
	};
	return createHash('sha1').update(password.split('').map((char) => escapes[char] ?? char).join('')).digest();
}

export function createUsersRepository(db: Pick<Pool, 'execute'>) {
	return {
		async authenticate(name: string, password: string): Promise<Member | null> {
			const [rows] = await db.execute<UserRow[]>(
				'SELECT id, user, pass, type FROM oko_user WHERE user = ? LIMIT 2', [name]
			);
			const hash = legacyPasswordHash(password);
			const row = rows.length === 1 ? rows[0] : undefined;
			const stored = row && /^[a-f0-9]{40}$/i.test(row.pass) ? Buffer.from(row.pass, 'hex') : Buffer.alloc(20);
			const matches = timingSafeEqual(hash, stored);
			return row && matches ? { id: row.id, name: row.user, type: row.type } : null;
		}
	};
}
