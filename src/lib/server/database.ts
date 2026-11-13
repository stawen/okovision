import { readFileSync } from 'node:fs';
import { createConnection, createPool, type ConnectionOptions, type Pool } from 'mysql2/promise';
import { loadServerEnvironment } from './environment.ts';
import { getMessages } from './messages.ts';

let pool: Pool | undefined;

/** Validates host-only DB_ADRESSE and builds a verified-TLS connection config by default. */
export function databaseOptions(env: NodeJS.ProcessEnv) {
	const messages = getMessages();
	const address = env.DB_ADRESSE?.trim();
	if (!address) throw new Error(messages.dbAddressRequired);

	let url: URL;
	try {
		url = new URL(`mysql://${address}`);
	} catch {
		throw new Error(messages.dbAddressInvalid);
	}
	if (!url.hostname || url.username || url.password || url.pathname || url.search || url.hash) {
		throw new Error(messages.dbAddressHostOnly);
	}
	const port = url.port ? Number(url.port) : 3306;
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(messages.dbPortInvalid);
	}

	if (!env.DB_NAME || !env.DB_USER) throw new Error(messages.dbNameAndUserRequired);
	if (env.DB_PASSWORD && env.DB_PASSWORD_FILE) {
		throw new Error(messages.dbPasswordConflict);
	}
	const password = env.DB_PASSWORD_FILE
		? readFileSync(env.DB_PASSWORD_FILE, 'utf8').replace(/\r?\n$/, '')
		: env.DB_PASSWORD;
	if (!password) throw new Error(messages.dbPasswordRequired);

	const tlsMode = env.DB_TLS_MODE || 'verify';
	if (tlsMode !== 'verify' && tlsMode !== 'disabled') {
		throw new Error(messages.dbTlsModeInvalid);
	}
	if (tlsMode === 'disabled' && env.DB_TLS_CA_FILE) {
		throw new Error(messages.dbTlsCaConflict);
	}

	return {
		host: url.hostname.replace(/^\[|\]$/g, ''),
		port,
		database: env.DB_NAME,
		user: env.DB_USER,
		password,
		connectTimeout: 10000,
		...(tlsMode === 'verify'
			? {
					ssl: {
						rejectUnauthorized: true,
						verifyIdentity: true,
						...(env.DB_TLS_CA_FILE ? { ca: readFileSync(env.DB_TLS_CA_FILE, 'utf8') } : {})
					}
				}
			: {})
	} satisfies ConnectionOptions;
}

/** Creates the short-lived connection used by startup checks and always closes it. */
export async function checkDatabaseConnection(env: NodeJS.ProcessEnv): Promise<void> {
	const connection = await createConnection(databaseOptions(env));
	try {
		await connection.query('SELECT 1');
	} finally {
		await connection.end();
	}
}

/** Lazily creates one shared pool after loading the server environment. */
export function getDatabasePool(): Pool {
	if (!pool) loadServerEnvironment();
	pool ??= createPool({
		...databaseOptions(process.env),
		connectionLimit: 4,
		waitForConnections: true,
		queueLimit: 20,
		dateStrings: true,
		timezone: 'Z'
	});
	return pool;
}
