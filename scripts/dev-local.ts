import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { checkDatabaseConnection } from '../src/lib/server/database.ts';

type DevMode = 'local' | 'setup' | 'v1';

function localDatabaseAddress(mode: DevMode, env: NodeJS.ProcessEnv): string {
	const ports: Record<DevMode, [string, string]> = {
		local: ['DEV_DB_PORT', '3307'],
		setup: ['DEV_SETUP_DB_PORT', '3309'],
		v1: ['DEV_V1_DB_PORT', '3311']
	};
	const [name, fallback] = ports[mode];
	const port = env[name] || fallback;
	if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
		throw new Error(`${name} doit être un port valide.`);
	}
	return `127.0.0.1:${port}`;
}

export async function prepareDevelopmentDatabase(mode: string, env: NodeJS.ProcessEnv): Promise<void> {
	if (mode !== 'local' && mode !== 'setup' && mode !== 'v1') {
		throw new Error(`Mode de développement invalide : ${mode}`);
	}
	env.DB_ADRESSE = localDatabaseAddress(mode, env);
	env.DB_NAME = 'okovision';
	env.DB_USER = 'okovision';
	await checkDatabaseConnection(env);

	if (mode === 'local') {
		const result = spawnSync(process.execPath, [
			'./node_modules/knex/bin/cli.js', '--knexfile', 'knexfile.js', 'migrate:latest'
		], { stdio: 'inherit', env });
		if (result.error) throw result.error;
		if (result.status !== 0) throw new Error('Échec des migrations de la base locale.');
	}
}

async function main() {
	await prepareDevelopmentDatabase(process.argv[2] ?? '', process.env);
	process.argv.splice(2, 1);
	await import(new URL('../node_modules/vite/bin/vite.js', import.meta.url).href);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main();
}
