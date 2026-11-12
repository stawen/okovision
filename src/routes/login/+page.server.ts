import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { allowLogin, createSession, revokeSession, sessionCookie, sessionLifetime } from '#lib/server/auth.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { uiMessages } from '#lib/i18n.js';
import { logger } from '#lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'authentication' });

export const load: PageServerLoad = ({ locals }) => {
	if (locals.member) redirect(303, resolve('/'));
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, getClientAddress }) => {
		const text = uiMessages(locals.language);
		if (!allowLogin(getClientAddress())) {
			log.info('loginRateLimited');
			return fail(429, { message: text.loginRateLimited });
		}
		const form = await request.formData();
		const name = form.get('username');
		const password = form.get('password');
		if (typeof name !== 'string' || typeof password !== 'string' ||
			!name.trim() || !password || name.length > 255 || password.length > 1024) {
			return fail(400, { message: text.loginInvalid });
		}
		let token: string;
		try {
			const member = await getDataAccess().users.authenticate(name.trim(), password);
			if (!member) {
				log.info('loginRejected');
				return fail(400, { message: text.loginInvalid });
			}
			token = createSession(member);
		} catch (cause) {
			log.error('loginFailed', cause);
			return fail(503, { message: text.loginUnavailable });
		}
		revokeSession(cookies.get(sessionCookie));
		cookies.set(sessionCookie, token, {
			path: '/', httpOnly: true, sameSite: 'lax',
			secure: url.protocol === 'https:', maxAge: sessionLifetime
		});
		redirect(303, resolve('/'));
	}
};
