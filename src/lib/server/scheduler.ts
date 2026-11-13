import cron from 'node-cron';
import { getJobManager } from './jobs.ts';
import { readInstallationConfig } from './config.ts';
import { logger } from './logger.ts';
import { loadServerEnvironment } from './environment.ts';

const log = logger.child({ component: 'scheduler' });
const globalScheduler = globalThis as typeof globalThis & { __okovisionScheduler?: Promise<void> };

/** Initializes the process-wide job manager once; collection runs automatically outside development. */
export function initializeJobs(schedule: boolean): Promise<void> {
	globalScheduler.__okovisionScheduler ??= (async () => {
		loadServerEnvironment();
		const config = schedule ? await readInstallationConfig() : undefined;
		const manager = await getJobManager(schedule);
		let task: ReturnType<typeof cron.schedule> | undefined;
		if (schedule) {
			try {
				if (!config) throw new Error('Installation configuration is required to schedule collection.');
				task = cron.schedule('2 */2 * * *', async () => {
					try {
						await manager.enqueue('collection', 'scheduler');
					} catch (error) {
						log.error('collectionFailed', error, { operation: 'schedule' });
					}
				}, {
					timezone: config.timezone,
					noOverlap: true
				});
				await manager.enqueue('collection', 'scheduler');
				log.info('collectionStarted');
			} catch (error) {
				log.error('collectionFailed', error, { operation: 'initialize' });
			}
		}
		const shutdown = () => {
			task?.stop();
			void manager.stop().catch((error: unknown) => log.error('collectionFailed', error, { operation: 'shutdown' }));
		};
		process.once('SIGTERM', shutdown);
		process.once('SIGINT', shutdown);
	})();
	return globalScheduler.__okovisionScheduler;
}
