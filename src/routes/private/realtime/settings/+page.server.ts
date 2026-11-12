import { boilerErrorCode, getBoilerIndicators } from '#lib/server/boiler.js';
import { logger } from '#lib/server/logger.js';
import type { PageServerLoad } from './$types';

const log = logger.child({ component: 'realtime-settings' });

export const load: PageServerLoad = async ({ locals }) => {
	try {
		return {
			language: locals.language,
			indicators: await getBoilerIndicators(1),
			realtimeError: null
		};
	} catch (cause) {
		const realtimeError = boilerErrorCode(cause);
		log.error('boilerReadFailed', cause, { circuit: 1, failure: realtimeError });
		return { language: locals.language, indicators: null, realtimeError };
	}
};
