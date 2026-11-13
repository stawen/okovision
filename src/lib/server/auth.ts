import { createHash, randomBytes } from 'node:crypto';
import type { Member } from './repositories/users.js';
import { getMessages } from './messages.js';

export const sessionCookie = 'okovision_session';
export const sessionLifetime = 8 * 60 * 60;
const attemptWindow = 15 * 60 * 1000;
const maxAttempts = 10;
const capacity = 10_000;

const sessions = new Map<string, { member: Member; expires: number }>();
const attempts = new Map<string, { count: number; expires: number }>();
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

function prune() {
	const now = Date.now();
	for (const [key, session] of sessions) if (session.expires <= now) sessions.delete(key);
	for (const [key, attempt] of attempts) if (attempt.expires <= now) attempts.delete(key);
}

/** Resolves only well-formed, unexpired tokens and returns a copy of the stored member. */
export function getSession(token: string | undefined): Member | null {
	if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
	const key = digest(token);
	const session = sessions.get(key);
	if (!session) return null;
	if (session.expires <= Date.now()) {
		sessions.delete(key);
		return null;
	}
	return { ...session.member };
}

/** Creates a random bearer token while keeping only its digest in the process-local session store. */
export function createSession(member: Member): string {
	prune();
	if (sessions.size >= capacity) throw new Error(getMessages().sessionCapacityExceeded);
	const token = randomBytes(32).toString('hex');
	sessions.set(digest(token), { member: { ...member }, expires: Date.now() + sessionLifetime * 1000 });
	return token;
}

/** Removes a token from the process-local session store; absent tokens are harmless. */
export function revokeSession(token: string | undefined): void {
	if (token) sessions.delete(digest(token));
}

/** Limits each client address to ten login attempts per in-memory fifteen-minute window. */
export function allowLogin(address: string): boolean {
	prune();
	const key = digest(address);
	const attempt = attempts.get(key);
	if (attempt) {
		if (attempt.count >= maxAttempts) return false;
		attempt.count++;
	} else {
		if (attempts.size >= capacity) return false;
		attempts.set(key, { count: 1, expires: Date.now() + attemptWindow });
	}
	return true;
}
