import { readFile } from 'node:fs/promises';
import createKnex from 'knex';
import { createConnection, type Connection, type Pool, type RowDataPacket } from 'mysql2/promise';
import knexConfig from '../../../knexfile.js';
import { configurationParameters, type ConfigurationValues } from '../configuration.ts';
import { databaseOptions, getDatabasePool } from './database.ts';
import { parseCollectionConfig, parseHistorySettings, parseInstallationConfig } from './config.ts';
import { hashNewPassword } from './repositories/users.ts';

type Database = Pick<Pool, 'execute'>;
export type SetupStatus = 'install' | 'partial' | 'configure' | 'ready';

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
	return {
		status: Number.isFinite(surface) && surface > 0 && collectionConfigured ? 'ready' : 'configure',
		values
	};
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
	return values;
}

async function saveConfiguration(connection: Connection, values: ConfigurationValues): Promise<void> {
	await connection.beginTransaction();
	try {
		for (const param of configurationParameters) {
			await connection.execute(
				'INSERT INTO oko_configuration (param, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
				[param, values[param]]
			);
		}
		await connection.commit();
	} catch (cause) {
		await connection.rollback();
		throw cause;
	}
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
		if (status === 'ready') throw new SetupError('complete');
		if (status === 'partial' && !force) throw new SetupError('force-required');
		if (status === 'install' || status === 'partial') {
			if (password.length < 12 || password.length > 1024) throw new SetupError('invalid');
			const hash = await hashNewPassword(password);
			await connection.query(await readFile('setup/install.sql', 'utf8'));
			await connection.execute(
				'INSERT INTO oko_user (user, pass, type) VALUES (?, ?, ?)', ['admin', hash, 'admin']
			);
		}
		const migrations = createKnex(knexConfig);
		try {
			await migrations.migrate.latest();
		} finally {
			await migrations.destroy();
		}
		await saveConfiguration(connection, values);
	} finally {
		try {
			if (locked) await connection.execute("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':setup'))");
		} finally {
			await connection.end();
		}
	}
}
