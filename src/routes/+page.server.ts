import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { isValidDay, shiftDay, todayInTimezone } from '#lib/dates.js';
import { readInstallationConfig } from '#lib/server/config.js';
import { getDatabasePool } from '#lib/server/database.js';
import { getDailyIndicators } from '#lib/server/queries/daily-indicators.js';
import { logger } from '#lib/server/logger.js';
import { getMessages } from '#lib/server/messages.js';
import type { Actions, PageServerLoad } from './$types';

async function dashboard(requestedDay?: string, direction?: string) {
	const messages = getMessages();
	const source = { file: 'src/routes/+page.server.ts', function: 'dashboard' };
	let config;
	try {
		config = await readInstallationConfig();
	} catch (cause) {
		logger.error(source, 'installationConfigInvalid', cause);
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
	try {
		const indicators = await getDailyIndicators(getDatabasePool(), day, config.poidsPellet);
		return { day, today, previous, next, indicators, databaseError: false };
	} catch (cause) {
		logger.error(source, 'dailyIndicatorsFailed', cause);
		return { day, today, previous, next, indicators: null, databaseError: true };
	}
}

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	if (url.searchParams.has('jour')) redirect(303, resolve('/'));
	return dashboard();
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const day = form.get('jour');
		const direction = form.get('direction');
		if (typeof day !== 'string' || (direction !== null && typeof direction !== 'string')) {
			error(400, getMessages().invalidDay);
		}
		return dashboard(day, direction ?? undefined);
	}
};
