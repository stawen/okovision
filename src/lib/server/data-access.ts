import { getDatabasePool } from './database.ts';
import { createMeasurementsRepository } from './repositories/measurements.ts';
import { createMaintenanceRepository } from './repositories/maintenance.ts';
import { createUsersRepository } from './repositories/users.ts';

function createDataAccess() {
	const db = getDatabasePool();
	return {
		measurements: createMeasurementsRepository(db),
		maintenance: createMaintenanceRepository(db),
		users: createUsersRepository(db)
	};
}

let dataAccess: ReturnType<typeof createDataAccess> | undefined;

export function getDataAccess() {
	dataAccess ??= createDataAccess();
	return dataAccess;
}
