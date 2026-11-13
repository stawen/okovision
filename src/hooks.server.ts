import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { publicErrorMessage } from '#lib/ui/i18n.js';
import { getAppLanguage } from '#lib/server/language.js';
import { getSession, sessionCookie } from '#lib/server/auth.js';
import { error, redirect } from '@sveltejs/kit';
import { resolve as resolvePath } from '$app/paths';
import { building, dev } from '$app/env';
import { initializeJobs } from '#lib/server/scheduler.js';
import { getSetupStatus } from '#lib/server/setup.js';
import { logger } from '#lib/server/logger.js';
import { setupMessages } from '#lib/ui/setup.js';

const log = logger.child({ component: 'setup' });

export const init = async () => {
	if (building) return;
	try {
		if (await getSetupStatus() === 'ready') await initializeJobs(!dev);
	} catch (cause) {
		log.error('setupFailed', cause);
	}
};

/** Sets request context before routes run, protects private URLs, and injects the selected UI language. */
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.language = getAppLanguage();
	event.locals.member = getSession(event.cookies.get(sessionCookie));
	event.setHeaders({ 'cache-control': 'no-store' });
	if (!building && event.route.id && event.route.id !== '/api/v1/health') {
		let status;
		try {
			status = await getSetupStatus();
		} catch (cause) {
			log.error('setupFailed', cause);
			error(503, setupMessages(event.locals.language).unavailable);
		}
		if (status === 'ready') {
			await initializeJobs(!dev);
		} else if (event.route.id !== '/setup' && event.route.id !== '/login') {
			if (event.route.id.startsWith('/api/') || event.route.id.startsWith('/private/api/')) {
				error(503, setupMessages(event.locals.language).required);
			}
			redirect(303, resolvePath('/setup'));
		} else if (event.route.id === '/login' && status === 'install') {
			redirect(303, resolvePath('/setup'));
		}
	}
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
