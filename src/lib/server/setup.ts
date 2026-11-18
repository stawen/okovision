import { readFile } from 'node:fs/promises';
import createKnex from 'knex';
import { createConnection, type Pool, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';
import knexConfig from '../../../knexfile.js';
import { configurationParameters, type ConfigurationValues } from '../configuration.ts';
import { databaseOptions, getDatabasePool } from './database.ts';
import {
	parseBoilerAddress, parseCollectionConfig, parseHistorySettings, parseInstallationConfig,
	saveConfiguration
} from './config.ts';
import { hashNewPassword } from './repositories/users.ts';
import { createSeasonsRepository } from './repositories/seasons.ts';
import { createBoilerCsvConnector } from './boiler-import.ts';
import { withWriteLock } from './collection.ts';
import { createCsvMappingRepository } from './repositories/csv-mapping.ts';
import { todayInTimezone } from '../utils/dates.ts';
import type { Language } from '../ui/i18n.ts';

type Database = Pick<Pool, 'execute'>;
export type SetupStatus = 'install' | 'partial' | 'configure' | 'matrix' | 'ready';

export class SetupError extends Error {
	readonly code: 'invalid' | 'force-required' | 'busy' | 'complete';
	constructor(code: SetupError['code']) {
		super(code);
		this.code = code;
	}
}

export async function getSetupState(db: Database = getDatabasePool()): Promise<{
	status: SetupStatus; values: Record<string, string | null>;
}> {
	const [tables] = await db.execute<(RowDataPacket & { name: string })[]>(
		'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
	);
	const names = tables.map((table) => table.name);
	if (!names.includes('oko_capteur')) {
		return {
			status: names.some((name) => !['knex_migrations', 'knex_migrations_lock'].includes(name))
				? 'partial' : 'install',
			values: {}
		};
	}
	if (!names.includes('oko_configuration')) return { status: 'configure', values: {} };
	const [rows] = await db.execute<(RowDataPacket & { param: string; value: string | null })[]>(
		'SELECT param, value FROM oko_configuration'
	);
	const values = Object.fromEntries(rows.map((row) => [row.param, row.value]));
	const surface = Number(values.surfaceMaison?.trim());
	const referenceTemperature = values.tcRef?.trim() ?? '';
	const collectionConfigured = Boolean(values.chaudiere?.trim()) && referenceTemperature !== ''
		&& Number.isFinite(Number(referenceTemperature));
	if (!Number.isFinite(surface) || surface <= 0 || !collectionConfigured) return { status: 'configure', values };
	const [sensors] = await db.execute<(RowDataPacket & { count: number | string })[]>(
		'SELECT COUNT(*) AS count FROM oko_capteur'
	);
	return { status: Number(sensors[0]?.count) > 0 ? 'ready' : 'matrix', values };
}

export async function getSetupStatus(db: Database = getDatabasePool()): Promise<SetupStatus> {
	return (await getSetupState(db)).status;
}

export function parseSetupValues(form: FormData): ConfigurationValues {
	const entries = configurationParameters.map((param) => {
		const value = form.get(param);
		if (typeof value !== 'string' || value.length > 255) throw new SetupError('invalid');
		return [param, value.trim()] as const;
	});
	// All parameter names are present because they are iterated above.
	const values = Object.fromEntries(entries) as ConfigurationValues;
	parseInstallationConfig(values);
	if (parseHistorySettings(values).surfaceMaison === null) throw new SetupError('invalid');
	if (!['0', '1'].includes(values.hasSilo)) throw new SetupError('invalid');
	if (values.hasSilo === '1' && parseHistorySettings(values).siloSize === null) throw new SetupError('invalid');
	parseCollectionConfig(values);
	const pci = Number(values.pciPellet);
	const efficiency = Number(values.rendementChaudiere);
	if (!values.pciPellet || !Number.isFinite(pci) || pci <= 0
		|| !values.rendementChaudiere || !Number.isFinite(efficiency) || efficiency <= 0 || efficiency > 100) {
		throw new SetupError('invalid');
	}
	return values;
}

export async function completeSetup(values: ConfigurationValues, password: string, force: boolean): Promise<void> {
	const connection = await createConnection({ ...databaseOptions(process.env), multipleStatements: true });
	let locked = false;
	try {
		const [lock] = await connection.execute<(RowDataPacket & { acquired: number })[]>(
			"SELECT GET_LOCK(CONCAT(DATABASE(), ':setup'), 0) AS acquired"
		);
		if (lock[0].acquired !== 1) throw new SetupError('busy');
		locked = true;
		const status = await getSetupStatus(connection);
		if (status === 'ready' || status === 'matrix') throw new SetupError('complete');
		if (status === 'partial' && !force) throw new SetupError('force-required');
		const createInitialSeason = status === 'install' || status === 'partial';
		if (createInitialSeason) {
			if (password.length < 12 || password.length > 1024) throw new SetupError('invalid');
			const hash = await hashNewPassword(password);
			await connection.query(await readFile('setup/install.sql', 'utf8'));
			const [result] = await connection.execute<ResultSetHeader>(
				'UPDATE oko_user SET pass = ?, type = ? WHERE user = ?', [hash, 'admin', 'admin']
			);
			if (result.affectedRows !== 1) throw new SetupError('invalid');
		}
		const migrations = createKnex(knexConfig);
		try {
			await migrations.migrate.latest();
		} finally {
			await migrations.destroy();
		}
		const [energyState] = await connection.execute<ResultSetHeader>(
			'UPDATE oko_energy_state SET dirty = 1 WHERE id = 1'
		);
		if (energyState.affectedRows !== 1) throw new Error('Missing energy state');
		await saveConfiguration(connection, values);
		if (createInitialSeason) {
			await createSeasonsRepository(connection).createSeason(todayInTimezone(values.timezone));
		}
	} finally {
		try {
			if (locked) await connection.execute("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':setup'))");
		} finally {
			await connection.end();
		}
	}
}

export async function initializeSetupMatrix(language: Language): Promise<void> {
	const { status, values } = await getSetupState();
	if (status === 'ready') return;
	if (status !== 'matrix') throw new Error('Setup configuration is incomplete');

	const timezone = values.timezone;
	if (!timezone) throw new Error('Setup time zone is missing');
	const day = todayInTimezone(timezone);
	const filename = `touch_${day.replaceAll('-', '')}.csv`;
	const csv = await createBoilerCsvConnector().importFile(parseBoilerAddress(values), filename);
	await withWriteLock(new AbortController().signal, async (db, signal) => {
		signal.throwIfAborted();
		const repository = createCsvMappingRepository(db);
		if ((await repository.getSensors()).length) return;
		signal.throwIfAborted();
		await repository.update(csv, language, 'create');
	});
}
