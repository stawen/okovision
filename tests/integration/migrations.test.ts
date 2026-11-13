import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { createConnection, type RowDataPacket } from 'mysql2/promise';
import { configurationParameters } from '../../src/lib/configuration.ts';
import { databaseOptions } from '../../src/lib/server/database.ts';
import { getSetupStatus, completeSetup } from '../../src/lib/server/setup.ts';

const exec = promisify(execFile);

test('migrations Knex sur la base Docker V1 sans reinitialisation du legacy', async (t) => {
	const env = {
		...process.env,
		DB_ADRESSE: `127.0.0.1:${process.env.DEV_TEST_DB_PORT || 3308}`
	};
	const connection = await createConnection(databaseOptions(env));
	const directory = await mkdtemp(join(tmpdir(), 'okovision-migrations-'));
	const run = (...args: string[]) => exec(process.execPath, [
		'--env-file=.env.dev',
		'./node_modules/knex/bin/cli.js',
		'--knexfile', 'knexfile.js',
		...args,
		'--migrations-directory', directory
	], { env });
	const businessTotals = () => connection.query<RowDataPacket[]>(
		'SELECT COUNT(*) AS count, SUM(conso_kg) AS kg FROM oko_resume_day'
	);

	try {
		const [before] = await businessTotals();
		assert.ok(Number(before[0].count) > 0);
		const [existing] = await connection.query<RowDataPacket[]>(
			"SHOW TABLES LIKE 'knex_migrations%'"
		);
		assert.equal(existing.length, 0, 'utiliser une base de test fraichement creee');

		await t.test('genere une migration ESM et refuse de valider un squelette non implemente', async () => {
			await run('migrate:make', 'integration_probe');
			const [filename] = await readdir(directory);
			assert.match(filename, /^\d+_integration_probe\.mjs$/);
			await assert.rejects(run('migrate:latest'), /Migration up non implementee/);
			const [applied] = await connection.query<RowDataPacket[]>('SELECT * FROM knex_migrations');
			assert.equal(applied.length, 0);
		});

		await t.test('applique une creation de table une seule fois apres correction', async () => {
			const [filename] = await readdir(directory);
			await writeFile(join(directory, filename), `
export async function up(knex) {
	await knex.schema.createTable('knex_integration_probe', (table) => {
		table.increments('id');
	});
}
export async function down(knex) {
	await knex.schema.dropTable('knex_integration_probe');
}
export const config = { transaction: false };
`);
			await run('migrate:latest');
			await run('migrate:latest');
			const [applied] = await connection.query<RowDataPacket[]>('SELECT * FROM knex_migrations');
			assert.equal(applied.length, 1);
			assert.equal(applied[0].name, filename);
			const [tables] = await connection.query<RowDataPacket[]>(
				"SHOW TABLES LIKE 'knex_integration_probe'"
			);
			assert.equal(tables.length, 1);
			assert.deepEqual((await businessTotals())[0], before);
			assert.match((await run('migrate:list')).stdout, /integration_probe\.mjs/);
		});

		await t.test('annule uniquement la nouvelle table sans toucher aux donnees legacy', async () => {
			await run('migrate:rollback');
			const [tables] = await connection.query<RowDataPacket[]>(
				"SHOW TABLES LIKE 'knex_integration_probe'"
			);
			assert.equal(tables.length, 0);
			const [applied] = await connection.query<RowDataPacket[]>('SELECT * FROM knex_migrations');
			assert.equal(applied.length, 0);
			assert.deepEqual((await businessTotals())[0], before);
		});
		await t.test('supprime les options historiques sans toucher aux comptes ni aux synthèses', async () => {
			process.env.DB_ADRESSE = env.DB_ADRESSE;
			assert.equal(await getSetupStatus(connection), 'configure');
			const [users] = await connection.query<RowDataPacket[]>('SELECT * FROM oko_user ORDER BY id');
			await connection.query(
				'CREATE TABLE oko_configuration (param varchar(100) NOT NULL PRIMARY KEY, value text DEFAULT NULL) ENGINE=InnoDB'
			);
			await connection.execute(
				'INSERT INTO oko_configuration (param, value) VALUES (?, ?), (?, ?), (?, ?)',
				['getDataFromChaudiere', '1', 'sendToWeb', '0', 'lang', 'fr']
			);
			await completeSetup({
				chaudiere: '192.168.1.23', tcRef: '20', poidsPellet: '150', surfaceMaison: '120',
				timezone: 'Europe/Paris', hasSilo: '0', siloSize: '', ashtray: ''
			}, '', false);
			assert.equal(await getSetupStatus(connection), 'ready');
			assert.deepEqual((await businessTotals())[0], before);
			assert.deepEqual((await connection.query<RowDataPacket[]>('SELECT * FROM oko_user ORDER BY id'))[0], users);
			const [applied] = await connection.query<RowDataPacket[]>('SELECT name FROM knex_migrations');
			assert.equal(applied.length, 2);
			assert.ok(applied.some((row) => /create_oko_configuration\.mjs$/.test(row.name)));
			assert.ok(applied.some((row) => /remove_obsolete_setup_settings\.mjs$/.test(row.name)));
			const [parameters] = await connection.query<RowDataPacket[]>('SELECT param FROM oko_configuration');
			assert.deepEqual(parameters.map((row) => row.param).sort(), [...configurationParameters].sort());
		});
	} finally {
		await connection.end();
		await rm(directory, { recursive: true, force: true });
	}
});
