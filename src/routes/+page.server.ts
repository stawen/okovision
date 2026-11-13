import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { isValidDay, shiftDay, todayInTimezone } from '#lib/utils/dates.js';
import { uiMessages, type Language } from '#lib/ui/i18n.js';
import { readInstallationConfig } from '#lib/server/config.js';
import { getDataAccess } from '#lib/server/data-access.js';
import type { DailyChartsResult } from '#lib/server/repositories/daily-charts.js';
import type { AshtrayStatus } from '#lib/server/repositories/maintenance.js';
import { logger } from '#lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'dashboard' });

async function dashboard(language: Language, requestedDay?: string, direction?: string) {
	const messages = uiMessages(language);
	let config;
	try {
		config = await readInstallationConfig();
	} catch (cause) {
		log.error('installationConfigInvalid', cause);
		error(500, messages.installationConfigInvalid);
	}
	const today = todayInTimezone(config.timezone);
	let day = requestedDay ?? today;
	if (!isValidDay(day) || day > today) error(400, messages.invalidOrFutureDay);
	if (direction && direction !== '-1' && direction !== '1') error(400, messages.invalidDirection);
	if (direction === '-1' && day > '1000-01-01') day = shiftDay(day, -1);
	if (direction === '1' && day < today) day = shiftDay(day, 1);
	const previous = day === '1000-01-01' ? null : shiftDay(day, -1);
	const next = day === today ? null : shiftDay(day, 1);
	let indicators;
	let databaseError = false;
	try {
		indicators = await getDataAccess().measurements.getDailyIndicators(day, config.poidsPellet);
	} catch (cause) {
		log.error('dailyIndicatorsFailed', cause, { day });
		indicators = null;
		databaseError = true;
	}
	let chartData: DailyChartsResult = { graphs: [], annotations: [], sampleCount: 0 };
	let chartError = false;
	try {
		chartData = await getDataAccess().charts.getDailyCharts(day);
	} catch (cause) {
		log.error('dailyChartsFailed', cause, { day });
		chartError = true;
	}
	let ashtray: AshtrayStatus | 'missing-capacity' | 'error' = 'missing-capacity';
	if (config.ashtray !== null) {
		try {
			ashtray = await getDataAccess().maintenance.getAshtrayStatus(config.ashtray);
		} catch (cause) {
			log.error('ashtrayStatusFailed', cause);
			ashtray = 'error';
		}
	}
	return { day, today, previous, next, indicators, databaseError, chartData, chartError, ashtray };
}

export const load: PageServerLoad = async ({ url, locals }) => {
	if (url.searchParams.has('jour')) redirect(303, resolve('/'));
	return dashboard(locals.language);
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const day = form.get('jour');
		const direction = form.get('direction');
		if (typeof day !== 'string' || (direction !== null && typeof direction !== 'string')) {
			error(400, uiMessages(locals.language).invalidDay);
		}
		return dashboard(locals.language, day, direction ?? undefined);
	}
};
