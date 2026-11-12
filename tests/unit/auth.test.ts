import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allowLogin, createSession, getSession, revokeSession, sessionLifetime } from '../../src/lib/server/auth';

const member = { id: 1, name: 'member', type: 'admin' };

describe('sessions membre et limitation de connexion', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-11-12T10:00:00Z'));
	});
	afterEach(() => vi.useRealTimers());

	it('utilise des jetons opaques, révoque une session sans affecter une autre', () => {
		const first = createSession(member);
		const second = createSession(member);
		expect(first).not.toBe(second);
		expect(getSession(first)).toEqual(member);
		expect(getSession('forged')).toBeNull();
		revokeSession(first);
		expect(getSession(first)).toBeNull();
		expect(getSession(second)).toEqual(member);
		revokeSession(second);
	});

	it('expire exactement au bout de huit heures', () => {
		const token = createSession(member);
		vi.advanceTimersByTime(sessionLifetime * 1000 - 1);
		expect(getSession(token)).toEqual(member);
		vi.advanceTimersByTime(1);
		expect(getSession(token)).toBeNull();
	});

	it('accepte dix tentatives, bloque la onzième puis libère après quinze minutes', () => {
		for (let i = 0; i < 10; i++) expect(allowLogin('rate-test')).toBe(true);
		expect(allowLogin('rate-test')).toBe(false);
		expect(allowLogin('other-client')).toBe(true);
		vi.advanceTimersByTime(15 * 60 * 1000 - 1);
		expect(allowLogin('rate-test')).toBe(false);
		vi.advanceTimersByTime(1);
		expect(allowLogin('rate-test')).toBe(true);
	});
});
