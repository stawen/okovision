import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { revokeSession, sessionCookie } from '#lib/server/auth.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ cookies }) => {
	revokeSession(cookies.get(sessionCookie));
	cookies.delete(sessionCookie, { path: '/' });
	redirect(303, resolve('/'));
};
