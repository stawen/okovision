import { getDataAccess } from '#lib/server/data-access.js';
import { getBoilerIndicators, boilerErrorCode } from '#lib/server/boiler.js';
import { logger } from '#lib/server/logger.js';
import type { PageServerLoad } from './$types';

const log = logger.child({ component: 'boiler-configurations' });

export const load: PageServerLoad = async () => {
	const [configurations, indicators] = await Promise.allSettled([
		Promise.resolve().then(() => getDataAccess().boilerConfigurations.list()),
		getBoilerIndicators(1)
	]);
	if (configurations.status === 'rejected') log.error('boilerConfigurationFailed', configurations.reason, { operation: 'list' });
	if (indicators.status === 'rejected') log.error('boilerReadFailed', indicators.reason);
	return {
		configurations: configurations.status === 'fulfilled' ? configurations.value : [],
		databaseError: configurations.status === 'rejected',
		indicators: indicators.status === 'fulfilled' ? indicators.value : null,
		realtimeError: indicators.status === 'rejected' ? boilerErrorCode(indicators.reason) : null
	};
};
