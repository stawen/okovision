import { fail } from '@sveltejs/kit';
import { uiMessages } from '#lib/i18n.js';
import { BoilerImportError, type BoilerImportErrorCode } from '#lib/server/boiler-import-error.js';
import { getBoilerCsvFiles, importBoilerCsvFile } from '#lib/server/boiler-import.js';
import { logger } from '#lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'boiler-import' });

function importErrorMessage(code: BoilerImportErrorCode, text: ReturnType<typeof uiMessages>): string {
	switch (code) {
		case 'configuration': return text.boilerImportConfigurationError;
		case 'connection': return text.boilerImportConnectionError;
		case 'response': return text.boilerImportFileInvalid;
		case 'file-not-found': return text.boilerImportFileNotFound;
		case 'mapping': return text.boilerImportMappingError;
		case 'database': return text.boilerImportWriteError;
	}
}

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
		if (typeof filename !== 'string' || !filename.trim()) {
			return fail(400, { error: text.boilerImportFileInvalid });
		}

		try {
			const imported = await importBoilerCsvFile(filename);
			const date = `${filename.slice(12, 14)}/${filename.slice(10, 12)}/${filename.slice(6, 10)}`;
			return {
				successCount: imported,
				successMessage: text.boilerImportSuccess
					.replace('{date}', date)
					.replace('{count}', String(imported))
					.replace('{plural}', imported > 1 ? 's' : '')
			};
		} catch (cause) {
			const code = cause instanceof BoilerImportError ? cause.code : 'database';
			log.error('boilerImportFailed', cause, { operation: 'import', failure: code });
			return fail(code === 'database' ? 500 : 502, { error: importErrorMessage(code, text) });
		}
	}
};
