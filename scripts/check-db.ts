import { checkDatabaseConnection } from '../src/lib/server/database.ts';
import { logger } from '../src/lib/server/logger.ts';
import { getMessages } from '../src/lib/server/messages.ts';

async function main() {
	const messages = getMessages();
	const source = { file: 'scripts/check-db.ts', function: 'main' };
	try {
		await checkDatabaseConnection(process.env);
		logger.info(source, 'databaseCheckSucceeded');
	} catch (error) {
		const message = error instanceof Error ? error.message : messages.unknownError;
		logger.error(source, 'databaseCheckFailed', message);
		process.exitCode = 1;
	}
}

await main();
