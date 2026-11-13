import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { configurationParameters } from '#lib/configuration.js';
import { allowLogin } from '#lib/server/auth.js';
import { completeSetup, getSetupState, parseSetupValues, SetupError } from '#lib/server/setup.js';
import { logger } from '#lib/server/logger.js';
import { setupMessages } from '#lib/ui/setup.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'setup' });

export const load: PageServerLoad = async ({ locals }) => {
	const { status, values } = await getSetupState();
	if (status === 'ready') redirect(303, resolve('/'));
	const admin = locals.member?.type === 'admin';
	return { status, admin, values: admin ? values : {} };
};

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => {
		const text = setupMessages(locals.language);
		if (!allowLogin(`setup:${getClientAddress()}`)) {
			log.info('loginRateLimited');
			return fail(429, { message: text.limited, values: undefined });
		}
		const form = await request.formData();
		let values;
		const password = form.get('adminPassword');
		try {
			values = parseSetupValues(form);
			if (password && (typeof password !== 'string' || password !== form.get('confirmPassword'))) {
				throw new SetupError('invalid');
			}
		} catch (cause) {
			log.info('setupInvalid', { error: cause instanceof Error ? cause.message : 'invalid' });
			return fail(400, {
				message: text.invalid,
				values: Object.fromEntries(configurationParameters.map((param) => [param, String(form.get(param) ?? '').slice(0, 255)]))
			});
		}
		try {
			await completeSetup(values, typeof password === 'string' ? password : '',
				form.get('force') === 'yes' && form.get('forceConfirmation') === 'INSTALLER');
		} catch (cause) {
			if (cause instanceof SetupError) {
				log.info('setupInvalid', { error: cause.code });
				const message = {
					invalid: text.invalid, 'force-required': text.forceRequired,
					busy: text.busy, complete: text.complete
				}[cause.code];
				return fail(cause.code === 'invalid' ? 400 : 409, { message, values });
			}
			log.error('setupFailed', cause);
			return fail(503, { message: text.unavailable, values });
		}
		redirect(303, resolve('/'));
	}
};
