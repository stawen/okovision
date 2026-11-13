import { getDatabasePool } from './database.ts';
import { createDailyChartsRepository } from './repositories/daily-charts.ts';
import { createMeasurementsRepository } from './repositories/measurements.ts';
import { createMaintenanceRepository } from './repositories/maintenance.ts';
import { createHistoryRepository } from './repositories/history.ts';
import { createUsersRepository } from './repositories/users.ts';
import { createDailyReportsRepository } from './repositories/daily-reports.ts';
import { createSeasonsRepository } from './repositories/seasons.ts';
import { createSiloEventsRepository } from './repositories/silo-events.ts';

function createDataAccess() {
	const db = getDatabasePool();
	return {
		charts: createDailyChartsRepository(db),
		measurements: createMeasurementsRepository(db),
		history: createHistoryRepository(db),
		maintenance: createMaintenanceRepository(db),
		users: createUsersRepository(db),
		dailyReports: createDailyReportsRepository(db),
		seasons: createSeasonsRepository(db),
		siloEvents: createSiloEventsRepository(db)
	};
}

let dataAccess: ReturnType<typeof createDataAccess> | undefined;

export function getDataAccess() {
	dataAccess ??= createDataAccess();
	return dataAccess;
}
