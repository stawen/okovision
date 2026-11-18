import { fail } from '@sveltejs/kit';
import { readCollectionConfig } from '#lib/server/config.js';
import { withWriteLock } from '#lib/server/collection.js';
import { createDailySummaryRepository, DailySummaryNoDataError } from '#lib/server/repositories/daily-summary.js';
import { createEnergyRepository } from '#lib/server/repositories/energy.js';
import { logger } from '#lib/server/logger.js';
import { uiMessages } from '#lib/ui/i18n.js';
import { isValidDay, shiftDay, todayInTimezone } from '#lib/utils/dates.js';
import type { EnergyParameters, EnergySummary } from '#lib/indicators/energy.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'daily-summaries' });

function energyReport(result: { summaries: EnergySummary[]; parameters: EnergyParameters | null }, saved: boolean) {
	const { summaries, parameters } = result;
	return {
		saved,
		firstDay: summaries[0]?.day ?? null,
		lastDay: summaries.at(-1)?.day ?? null,
		count: summaries.length,
		partial: summaries.filter((row) => row.partial).length,
		missingEnergy: summaries.filter((row) => row.energy === null).length,
		missingPrice: summaries.filter((row) => row.priceKg === null).length,
		parameters
	};
}

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
	energyPreview: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		if (!locals.member) return fail(403, { error: text.dailySummariesForbidden });
		try {
			return await withWriteLock(request.signal, async (db) => {
				const energy = createEnergyRepository(db);
				if (await energy.status() === 'unavailable') {
					return fail(422, { error: text.energyMigrationRequired });
				}
				return { energyReport: energyReport(await energy.calculate(), false) };
			});
		} catch (cause) {
			log.error('dailySummariesFailed', cause, { operation: 'energyPreview' });
			return fail(500, { error: text.dailySummariesWriteFailed });
		}
	},
	energyRecalculate: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		if (!locals.member) return fail(403, { error: text.dailySummariesForbidden });
		const form = await request.formData();
		if (form.get('confirmed') !== 'yes') return fail(400, { error: text.energyConfirmationRequired });
		try {
			return await withWriteLock(request.signal, async (db, signal) => {
				const energy = createEnergyRepository(db);
				if (await energy.status() === 'unavailable') {
					return fail(422, { error: text.energyMigrationRequired });
				}
				const result = await energy.rebuild(signal);
				log.info('dailySummaryRecalculated', { operation: 'energy', memberId: locals.member?.id, count: result.summaries.length });
				return { energyReport: energyReport(result, true) };
			});
		} catch (cause) {
			log.error('dailySummariesFailed', cause, { operation: 'energyRecalculate' });
			return fail(500, { error: text.dailySummariesWriteFailed });
		}
	},
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
				return createEnergyRepository(db).mutate(signal,
					() => createDailySummaryRepository(db).save(day, today, true, config.poidsPellet, config.tcRef),
					(cause) => cause instanceof DailySummaryNoDataError
				);
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
