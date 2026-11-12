import { error, isHttpError } from '@sveltejs/kit';
import { todayInTimezone } from '#lib/dates.js';
import { uiMessages } from '#lib/i18n.js';
import { readHistoryConfig } from '#lib/server/config.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { logger } from '#lib/server/logger.js';
import type { StockStatus } from '#lib/server/repositories/maintenance.js';
import type { PageServerLoad } from './$types';

const log = logger.child({ component: 'history' });

function parsePeriodValue(value: string | null, fallback: number, min: number, max: number): number {
	if (value === null) return fallback;
	if (!/^\d+$/.test(value)) return NaN;
	const parsed = Number(value);
	return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : NaN;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const text = uiMessages(locals.language);
	let config;
	let settings;
	try {
		({ installation: config, settings } = await readHistoryConfig());
	} catch (cause) {
		log.error('historyFailed', cause);
		error(500, text.historyDataUnavailable);
	}

	const today = todayInTimezone(config.timezone);
	const defaultMonth = Number(today.slice(5, 7));
	const defaultYear = Number(today.slice(0, 4));
	const month = parsePeriodValue(url.searchParams.get('month'), defaultMonth, 1, 12);
	const yearValue = url.searchParams.get('year');
	const requestedYear = parsePeriodValue(yearValue, defaultYear, 1000, 9999);
	const seasonIdValue = url.searchParams.get('season');
	const requestedSeasonId = seasonIdValue === null
		? null
		: parsePeriodValue(seasonIdValue, 0, 1, Number.MAX_SAFE_INTEGER);
	if (!Number.isFinite(month) || !Number.isFinite(requestedYear)
		|| (requestedSeasonId !== null && !Number.isFinite(requestedSeasonId))) {
		error(400, text.invalidHistorySelection);
	}

	let stock: StockStatus | { status: 'error' };
	try {
		stock = await getDataAccess().maintenance.getStockStatus(settings.hasSilo, settings.siloSize);
	} catch (cause) {
		log.error('stockStatusFailed', cause);
		stock = { status: 'error' };
	}

	let year = requestedYear;
	try {
		const history = getDataAccess().history;
		const [years, seasons] = await Promise.all([history.getYears(), history.getSeasons()]);
		if (yearValue === null && years.length > 0 && !years.includes(year)) {
			year = years[0];
		} else if (yearValue !== null && years.length > 0 && !years.includes(year)) {
			error(400, text.invalidHistorySelection);
		}
		const selectedSeason = requestedSeasonId === null
			? seasons.find((season) => season.startDate <= today && season.endDate >= today) ?? seasons[0] ?? null
			: seasons.find((season) => season.id === requestedSeasonId) ?? null;
		if (seasonIdValue !== null && !selectedSeason) error(400, text.invalidHistorySelection);

		const [monthly, seasonal] = await Promise.all([
			history.getMonthlyHistory(month, year),
			selectedSeason ? history.getSeasonHistory(selectedSeason, settings.surfaceMaison) : null
		]);
		return {
			month,
			year,
			years,
			seasons,
			selectedSeasonId: selectedSeason?.id ?? null,
			monthly,
			seasonal,
			today,
			stock,
			databaseError: false
		};
	} catch (cause) {
		if (isHttpError(cause)) throw cause;
		log.error('historyFailed', cause, { month, year, seasonId: requestedSeasonId });
		const years: number[] = [];
		return {
			month,
			year,
			years,
			seasons: [],
			selectedSeasonId: null,
			monthly: null,
			seasonal: null,
			today,
			stock,
			databaseError: true
		};
	}
};
