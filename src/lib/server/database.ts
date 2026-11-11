import { readFileSync } from 'node:fs';
import { createConnection, type ConnectionOptions } from 'mysql2/promise';

export function databaseOptions(env: NodeJS.ProcessEnv): ConnectionOptions {
	const address = env.DB_ADRESSE?.trim();
	if (!address) throw new Error('DB_ADRESSE est obligatoire.');

	let url: URL;
	try {
		url = new URL(`mysql://${address}`);
	} catch {
		throw new Error('DB_ADRESSE doit contenir un hôte et, éventuellement, un port valide.');
	}
	if (!url.hostname || url.username || url.password || url.pathname || url.search || url.hash) {
		throw new Error('DB_ADRESSE doit contenir uniquement un hôte et, éventuellement, un port.');
	}
	const port = url.port ? Number(url.port) : 3306;
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('Le port de DB_ADRESSE doit être compris entre 1 et 65535.');
	}

	if (!env.DB_NAME || !env.DB_USER) throw new Error('DB_NAME et DB_USER sont obligatoires.');
	if (env.DB_PASSWORD && env.DB_PASSWORD_FILE) {
		throw new Error('Utiliser DB_PASSWORD ou DB_PASSWORD_FILE, pas les deux.');
	}
	const password = env.DB_PASSWORD_FILE
		? readFileSync(env.DB_PASSWORD_FILE, 'utf8').replace(/\r?\n$/, '')
		: env.DB_PASSWORD;
	if (!password) throw new Error('DB_PASSWORD ou DB_PASSWORD_FILE est obligatoire.');

	const tlsMode = env.DB_TLS_MODE || 'verify';
	if (tlsMode !== 'verify' && tlsMode !== 'disabled') {
		throw new Error('DB_TLS_MODE doit valoir verify ou disabled.');
	}
	if (tlsMode === 'disabled' && env.DB_TLS_CA_FILE) {
		throw new Error('DB_TLS_CA_FILE ne peut pas être utilisé avec DB_TLS_MODE=disabled.');
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
	};
}

export async function checkDatabaseConnection(env: NodeJS.ProcessEnv): Promise<void> {
	const connection = await createConnection(databaseOptions(env));
	try {
		await connection.query('SELECT 1');
	} finally {
		await connection.end();
	}
}
