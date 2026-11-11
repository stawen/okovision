import { checkDatabaseConnection } from '../src/lib/server/database.ts';
import { logger } from '../src/lib/server/logger.ts';

const log = logger.child({ component: 'database-check' });

async function main() {
	try {
		await checkDatabaseConnection(process.env);
		log.info('databaseCheckSucceeded');
	} catch (error) {
		log.error('databaseCheckFailed', error);
		process.exitCode = 1;
	}
}

await main();
