import { createConnection, type Connection, type RowDataPacket } from 'mysql2/promise';
import { createHash } from 'node:crypto';
import { databaseOptions } from './database.ts';
import { loadServerEnvironment } from './environment.ts';
import { boilerCsvDay, createBoilerCsvConnector } from './boiler-import.ts';
import { readBoilerAddress, readCollectionConfig } from './config.ts';
import { createBoilerImportRepository } from './repositories/boiler-import.ts';
import { createDailySummaryRepository } from './repositories/daily-summary.ts';

interface LockRow extends RowDataPacket {
	acquired: number | null;
}

export async function withWriteLock<T>(signal: AbortSignal, run: (connection: Connection, signal: AbortSignal) => Promise<T>): Promise<T> {
	loadServerEnvironment();
	const options = databaseOptions(process.env);
	const connection = await createConnection({ ...options, dateStrings: true, timezone: 'Z' });
	const controller = new AbortController();
	const abort = () => {
		controller.abort(signal.reason);
		connection.destroy();
	};
	if (signal.aborted) abort();
	else signal.addEventListener('abort', abort, { once: true });
	const onError = (error: Error) => controller.abort(error);
	connection.on('error', onError);
	const lockName = `okovision:${createHash('sha256').update(options.database ?? '').digest('hex').slice(0, 40)}`;
	try {
		controller.signal.throwIfAborted();
		const [rows] = await connection.execute<LockRow[]>('SELECT GET_LOCK(?, 0) AS acquired', [lockName]);
		if (rows[0]?.acquired !== 1) throw new Error('Database write lock unavailable');
		controller.signal.throwIfAborted();
		return await run(connection, controller.signal);
	} finally {
		signal.removeEventListener('abort', abort);
		connection.off('error', onError);
		connection.destroy();
	}
}

function todayInTimezone(timezone: string): string {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit'
	}).formatToParts(new Date());
	const find = (type: string) => parts.find((part) => part.type === type)?.value;
	return `${find('year')}-${find('month')}-${find('day')}`;
}

export async function importManualFile(filename: string, signal: AbortSignal): Promise<number> {
	const day = boilerCsvDay(filename);
	const address = await readBoilerAddress();
	const csv = await createBoilerCsvConnector().importFile(address, filename, signal);
	return withWriteLock(signal, async (db, lockedSignal) =>
		createBoilerImportRepository(db).importCsv(csv, day, lockedSignal));
}

export async function collectBoiler(
	signal: AbortSignal,
	progress: (completed: number, total: number, day: string, dirty: boolean) => Promise<void>,
	dirtyDays: ReadonlySet<string> = new Set()
): Promise<{ files: number; imported: number }> {
	const config = await readCollectionConfig();
	const connector = createBoilerCsvConnector();
	const files = await connector.getFiles(config.boilerAddress, signal);
	const availableDays = new Set(files.map((file) => boilerCsvDay(file.name)));
	for (const day of dirtyDays) {
		if (!availableDays.has(day)) throw new Error(`Missing file for interrupted day ${day}`);
	}
	return withWriteLock(signal, async (db, lockedSignal) => {
		const summaries = createDailySummaryRepository(db);
		const importer = createBoilerImportRepository(db);
		let imported = 0;
		let completed = 0;
		for (const file of files) {
			lockedSignal.throwIfAborted();
			const day = boilerCsvDay(file.name);
			const complete = await summaries.isDayComplete(day);
			await progress(completed, files.length, day, true);
			if (!complete) {
				const csv = await connector.importFile(config.boilerAddress, file.name, lockedSignal);
				lockedSignal.throwIfAborted();
				imported += await importer.importCsv(csv, day, lockedSignal);
			}
			lockedSignal.throwIfAborted();
			await summaries.save(day, todayInTimezone(config.timezone), !complete || dirtyDays.has(day), config.poidsPellet, config.tcRef);
			completed++;
			await progress(completed, files.length, day, false);
		}
		return { files: completed, imported };
	});
}
