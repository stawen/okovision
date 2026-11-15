import { fail } from '@sveltejs/kit';
import { readCollectionConfig } from '#lib/server/config.js';
import { withWriteLock } from '#lib/server/collection.js';
import { createDailySummaryRepository, DailySummaryNoDataError } from '#lib/server/repositories/daily-summary.js';
import { logger } from '#lib/server/logger.js';
import { uiMessages } from '#lib/ui/i18n.js';
import { isValidDay, shiftDay, todayInTimezone } from '#lib/utils/dates.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'daily-summaries' });

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const config = await readCollectionConfig();
		return {
			language: locals.language,
			latestDay: shiftDay(todayInTimezone(config.timezone), -1),
			loadError: false
		};
	} catch (cause) {
		log.error('dailySummariesFailed', cause, { operation: 'load' });
		return { language: locals.language, latestDay: '', loadError: true };
	}
};

export const actions: Actions = {
	recalculate: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		if (!locals.member) return fail(403, { error: text.dailySummariesForbidden });
		const form = await request.formData();
		const day = form.get('day');
		if (typeof day !== 'string' || !isValidDay(day)) {
			return fail(400, { error: text.dailySummariesInvalidPeriod });
		}
		try {
			const config = await readCollectionConfig();
			const today = todayInTimezone(config.timezone);
			if (day >= today) return fail(400, { error: text.dailySummariesInvalidPeriod });
			const result = await withWriteLock(request.signal, async (db, signal) => {
				signal.throwIfAborted();
				return createDailySummaryRepository(db).save(day, today, true, config.poidsPellet, config.tcRef);
			});
			if (result !== 'saved') throw new Error('Daily summary was not saved');
			log.info('dailySummaryRecalculated', { day, memberId: locals.member.id });
			return { day };
		} catch (cause) {
			log.error('dailySummariesFailed', cause, { operation: 'recalculate', day });
			if (cause instanceof DailySummaryNoDataError) {
				return fail(422, { error: text.dailySummariesNoData });
			}
			return fail(500, { error: text.dailySummariesWriteFailed });
		}
	}
};
