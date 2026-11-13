import { fail } from '@sveltejs/kit';
import { uiMessages } from '#lib/i18n.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { logger } from '#lib/server/logger.js';
import { SeasonError, type SeasonErrorCode } from '#lib/server/repositories/seasons.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'seasons' });

function seasonErrorMessage(code: SeasonErrorCode, text: ReturnType<typeof uiMessages>): string {
	switch (code) {
		case 'invalid-input': return text.seasonsErrorInvalidInput;
		case 'duplicate-season': return text.seasonsErrorDuplicate;
		case 'season-not-found': return text.seasonsErrorNotFound;
	}
}

function formText(form: FormData, key: string): string {
	const value = form.get(key);
	if (typeof value !== 'string') throw new SeasonError('invalid-input');
	return value;
}

function formId(form: FormData, key: string): number {
	const value = formText(form, key);
	if (!/^[1-9]\d*$/.test(value)) throw new SeasonError('invalid-input');
	const id = Number(value);
	if (!Number.isSafeInteger(id)) throw new SeasonError('invalid-input');
	return id;
}

async function seasonsPageData(language: Parameters<typeof uiMessages>[0]) {
	return {
		language,
		seasons: await getDataAccess().seasons.getSeasons(),
		databaseError: false
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	try {
		return await seasonsPageData(locals.language);
	} catch (cause) {
		log.error('seasonsFailed', cause);
		return {
			language: locals.language,
			seasons: [],
			databaseError: true
		};
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		const form = await request.formData();
		let operation = 'unknown';

		try {
			operation = formText(form, 'operation');
			const seasons = getDataAccess().seasons;
			switch (operation) {
				case 'create-season':
					await seasons.createSeason(formText(form, 'startDate'));
					break;
				case 'update-season':
					await seasons.updateSeason(formId(form, 'seasonId'), formText(form, 'startDate'));
					break;
				case 'delete-season':
					await seasons.deleteSeason(formId(form, 'seasonId'));
					break;
				default:
					throw new SeasonError('invalid-input');
			}
			return await seasonsPageData(locals.language);
		} catch (cause) {
			if (cause instanceof SeasonError) {
				return fail(400, { error: seasonErrorMessage(cause.code, text) });
			}
			log.error('seasonsFailed', cause, { operation });
			return fail(500, { error: text.seasonsWriteFailed });
		}
	}
};
