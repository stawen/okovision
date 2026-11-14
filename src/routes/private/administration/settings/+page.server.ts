import { error, fail } from '@sveltejs/kit';
import { configurationParameters } from '#lib/configuration.js';
import { getDatabasePool } from '#lib/server/database.js';
import { readConfiguration, saveConfiguration } from '#lib/server/config.js';
import { logger } from '#lib/server/logger.js';
import { parseSetupValues } from '#lib/server/setup.js';
import { setupMessages } from '#lib/ui/setup.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'administration-settings' });

function requireAdmin(member: App.Locals['member'], message: string): void {
	if (member?.type !== 'admin') error(403, message);
}

function submittedValues(form: FormData): Record<string, string> {
	return Object.fromEntries(configurationParameters.map((param) => [
		param, String(form.get(param) ?? '').slice(0, 255)
	]));
}

export const load: PageServerLoad = async ({ locals }) => {
	const text = setupMessages(locals.language);
	requireAdmin(locals.member, text.settingsForbidden);
	try {
		return { language: locals.language, values: await readConfiguration() };
	} catch (cause) {
		log.error('settingsLoadFailed', cause);
		error(503, text.settingsUnavailable);
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const text = setupMessages(locals.language);
		requireAdmin(locals.member, text.settingsForbidden);
		const form = await request.formData();
		let values;
		try {
			values = parseSetupValues(form);
		} catch (cause) {
			log.info('settingsInvalid', { error: cause instanceof Error ? cause.message : 'invalid' });
			return fail(400, { message: text.settingsInvalid, values: submittedValues(form) });
		}

		let connection;
		try {
			connection = await getDatabasePool().getConnection();
			await saveConfiguration(connection, values);
			return { success: true, values };
		} catch (cause) {
			log.error('settingsSaveFailed', cause);
			return fail(503, { message: text.settingsSaveFailed, values });
		} finally {
			connection?.release();
		}
	}
};
