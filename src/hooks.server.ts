import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { publicErrorMessage } from '#lib/i18n.js';
import { getAppLanguage } from '#lib/server/language.js';
import { getSession, sessionCookie } from '#lib/server/auth.js';
import { redirect } from '@sveltejs/kit';
import { resolve as resolvePath } from '$app/paths';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.language = getAppLanguage();
	event.locals.member = getSession(event.cookies.get(sessionCookie));
	event.setHeaders({ 'cache-control': 'no-store' });
	if (event.route.id?.startsWith('/private/') && !event.locals.member) {
		redirect(303, resolvePath('/login'));
	}
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%app.language%', event.locals.language)
	});
};

export const handleError: HandleServerError = ({ kind, error, event }) => {
	if (kind === 'unknown') console.error(error);
	if (kind === 'app' || !event.locals.language) return;
	const status = kind === 'unknown' ? 500 : error.status;
	return { message: publicErrorMessage(event.locals.language, status) };
};
