import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { allowLogin, revokeSession, sessionCookie } from '#lib/server/auth.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { logger } from '#lib/server/logger.js';
import { uiMessages } from '#lib/ui/i18n.js';
import type { Actions } from './$types';

const log = logger.child({ component: 'authentication' });

export const actions: Actions = {
	default: async ({ request, locals, cookies, getClientAddress }) => {
		if (!locals.member) redirect(303, resolve('/login'));
		const text = uiMessages(locals.language);
		if (!allowLogin(getClientAddress())) {
			log.info('loginRateLimited');
			return fail(429, { message: text.passwordChangeRateLimited });
		}
		const form = await request.formData();
		const current = form.get('currentPassword');
		const password = form.get('newPassword');
		const confirmation = form.get('confirmPassword');
		if (typeof current !== 'string' || !current || current.length > 1024 ||
			typeof password !== 'string' || password.length < 12 || password.length > 1024 ||
			typeof confirmation !== 'string' || password !== confirmation) {
			return fail(400, { message: text.passwordChangeInvalid });
		}
		try {
			const changed = await getDataAccess().users.changePassword(locals.member.id, current, password);
			if (!changed) return fail(400, { message: text.passwordChangeRejected });
		} catch (cause) {
			log.error('passwordChangeFailed', cause);
			return fail(503, { message: text.passwordChangeUnavailable });
		}
		revokeSession(cookies.get(sessionCookie));
		cookies.delete(sessionCookie, { path: '/' });
		redirect(303, resolve('/login'));
	}
};
