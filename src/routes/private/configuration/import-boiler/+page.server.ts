import { fail } from '@sveltejs/kit';
import { uiMessages } from '#lib/i18n.js';
import { getBoilerCsvFiles, isBoilerCsvFilename } from '#lib/server/boiler-import.js';
import { getJobManager } from '#lib/server/jobs.js';
import { logger } from '#lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'boiler-import' });

export const load: PageServerLoad = async ({ locals }) => {
	try {
		return { language: locals.language, files: await getBoilerCsvFiles(), loadError: false };
	} catch (cause) {
		log.error('boilerImportFailed', cause, { operation: 'list' });
		return { language: locals.language, files: [], loadError: true };
	}
};

export const actions: Actions = {
	import: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		const form = await request.formData();
		const filename = form.get('file');
		if (typeof filename !== 'string' || !isBoilerCsvFilename(filename)) {
			return fail(400, { error: text.boilerImportFileInvalid });
		}
		if (!locals.member) return fail(403, { error: text.boilerImportWriteError });
		try {
			const job = await (await getJobManager()).enqueue('import', String(locals.member.id), filename);
			return { jobId: job.id };
		} catch (cause) {
			log.error('boilerImportFailed', cause, { operation: 'enqueue' });
			return fail(500, { error: text.boilerImportWriteError });
		}
	}
};
