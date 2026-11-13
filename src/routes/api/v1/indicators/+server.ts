import { error } from '@sveltejs/kit';
import { isValidDay, todayInTimezone } from '#lib/utils/dates.js';
import { isChartRange, type ChartRange } from '#lib/indicators/daily.js';
import { uiMessages } from '#lib/ui/i18n.js';
import { readInstallationConfig } from '#lib/server/config.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { logger } from '#lib/server/logger.js';
import type { RequestHandler } from './$types';

const log = logger.child({ component: 'daily-indicators' });

export const GET: RequestHandler = async ({ url, locals }) => {
	const messages = uiMessages(locals.language);
	const day = url.searchParams.get('jour');
	if (!day || !isValidDay(day)) error(400, messages.invalidDay);
	const min = url.searchParams.get('min');
	const max = url.searchParams.get('max');
	let range: ChartRange | undefined;
	if (min !== null || max !== null) {
		if (!min?.trim() || !max?.trim()) error(400, messages.invalidIndicatorRange);
		range = { min: Number(min), max: Number(max) };
		if (!isChartRange(range)) error(400, messages.invalidIndicatorRange);
	}
	let config;
	try {
		config = await readInstallationConfig();
	} catch (cause) {
		log.error('installationConfigInvalid', cause);
		error(500, messages.installationConfigInvalid);
	}
	if (day > todayInTimezone(config.timezone)) error(400, messages.invalidOrFutureDay);
	try {
		const indicators = await getDataAccess().measurements.getDailyIndicators(day, config.poidsPellet, range);
		return Response.json(indicators, { headers: { 'cache-control': 'no-store' } });
	} catch (cause) {
		log.error('dailyIndicatorsFailed', cause, { day, range });
		error(503, messages.indicatorsError);
	}
};
