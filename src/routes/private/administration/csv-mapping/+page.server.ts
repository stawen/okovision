import { fail } from '@sveltejs/kit';
import { uiMessages } from '#lib/ui/i18n.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { createBoilerCsvConnector } from '#lib/server/boiler-import.js';
import { BoilerImportError } from '#lib/server/boiler-import-error.js';
import { parseBoilerAddress, readConfiguration } from '#lib/server/config.js';
import { withWriteLock } from '#lib/server/collection.js';
import { createCsvMappingRepository } from '#lib/server/repositories/csv-mapping.js';
import { todayInTimezone } from '#lib/utils/dates.js';
import { logger } from '#lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'csv-mapping' });

export const load: PageServerLoad = async () => {
	try {
		return { sensors: await getDataAccess().csvMapping.getSensors(), loadError: false };
	} catch (cause) {
		log.error('csvMappingFailed', cause, { operation: 'load' });
		return { sensors: [], loadError: true };
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		const mode = (await request.formData()).get('mode');
		if (!locals.member || (mode !== 'create' && mode !== 'update')) {
			return fail(400, { error: text.csvMappingWriteFailed });
		}
		try {
			const config = await readConfiguration();
			const timezone = config.timezone;
			if (!timezone) throw new Error('Missing timezone');
			const day = todayInTimezone(timezone);
			const filename = `touch_${day.replaceAll('-', '')}.csv`;
			const csv = await createBoilerCsvConnector().importFile(parseBoilerAddress(config), filename);
			await withWriteLock(new AbortController().signal, async (db, signal) => {
				signal.throwIfAborted();
				await createCsvMappingRepository(db).update(csv, locals.language, mode);
			});
			return { success: true };
		} catch (cause) {
			log.error('csvMappingFailed', cause, { operation: mode });
			if (cause instanceof BoilerImportError && cause.code === 'file-not-found') {
				return fail(404, { error: text.csvMappingFileNotFound });
			}
			return fail(500, { error: text.csvMappingWriteFailed });
		}
	}
};
