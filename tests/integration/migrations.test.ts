import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { createConnection, type RowDataPacket } from 'mysql2/promise';
import createKnex from 'knex';
import knexConfig from '../../knexfile.js';
import { up as addEnergyConfiguration } from '../../migrations/20261118150000_add_energy_configuration.mjs';
import { up as addDailyEnergy } from '../../migrations/20261118153000_add_daily_energy.mjs';
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
			assert.equal((await connection.query<RowDataPacket[]>("SHOW TABLES LIKE 'oko_energy_state'"))[0].length, 0);
			const [users] = await connection.query<RowDataPacket[]>('SELECT * FROM oko_user ORDER BY id');
			const [sensors] = await connection.query<RowDataPacket[]>('SELECT * FROM oko_capteur ORDER BY id');
			await connection.query(
				'CREATE TABLE oko_configuration (param varchar(100) NOT NULL PRIMARY KEY, value text DEFAULT NULL) ENGINE=InnoDB'
			);
			await connection.execute(
				'INSERT INTO oko_configuration (param, value) VALUES (?, ?), (?, ?), (?, ?)',
				['getDataFromChaudiere', '1', 'sendToWeb', '0', 'lang', 'fr']
			);
			await completeSetup({
				chaudiere: '192.168.1.23', tcRef: '20', poidsPellet: '150', surfaceMaison: '120',
				timezone: 'Europe/Paris', hasSilo: '0', siloSize: '', ashtray: '',
				pciPellet: '4.90', rendementChaudiere: '89.50'
			}, '', false);
			assert.equal(await getSetupStatus(connection), 'ready');
			assert.deepEqual((await businessTotals())[0], before);
			assert.deepEqual((await connection.query<RowDataPacket[]>('SELECT * FROM oko_user ORDER BY id'))[0], users);
			assert.deepEqual(
				(await connection.query<RowDataPacket[]>('SELECT * FROM oko_capteur ORDER BY id'))[0],
				sensors.map((sensor) => sensor.original_name === 'WW1 Pumpe' && !sensor.type
					? { ...sensor, type: 'hotwater[0]' } : sensor)
			);
			const [applied] = await connection.query<RowDataPacket[]>('SELECT name FROM knex_migrations');
			assert.equal(applied.length, 5);
			assert.ok(applied.some((row) => /create_oko_configuration\.mjs$/.test(row.name)));
			assert.ok(applied.some((row) => /remove_obsolete_setup_settings\.mjs$/.test(row.name)));
			assert.ok(applied.some((row) => /complete_legacy_hotwater_sensor_type\.mjs$/.test(row.name)));
			assert.ok(applied.some((row) => /add_daily_energy\.mjs$/.test(row.name)));
			const [energyTable] = await connection.query<RowDataPacket[]>(
				"SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'oko_energy_state'"
			);
			assert.equal(String(energyTable[0]?.ENGINE).toLowerCase(), 'innodb');
			const [energyState] = await connection.query<RowDataPacket[]>('SELECT id, dirty FROM oko_energy_state');
			assert.deepEqual(energyState.map((row) => [row.id, row.dirty]), [[1, 1]]);
			const [parameters] = await connection.query<RowDataPacket[]>('SELECT param FROM oko_configuration');
			assert.deepEqual(parameters.map((row) => row.param).sort(), [...configurationParameters].sort());
		});
		await t.test('ajoute les paramètres énergie absents sans remplacer une valeur existante', async () => {
			await connection.execute(
				"UPDATE oko_configuration SET value = '4.30' WHERE param = 'pciPellet'"
			);
			await connection.execute("DELETE FROM oko_configuration WHERE param = 'rendementChaudiere'");
			const knex = createKnex(knexConfig);
			try {
				await addEnergyConfiguration(knex);
				await addEnergyConfiguration(knex);
			} finally {
				await knex.destroy();
			}
			const [rows] = await connection.query<RowDataPacket[]>(
				"SELECT param, value FROM oko_configuration WHERE param IN ('pciPellet', 'rendementChaudiere')"
			);
			assert.deepEqual(Object.fromEntries(rows.map((row) => [row.param, row.value])), {
				pciPellet: '4.30', rendementChaudiere: '89.50'
			});
			await t.test('reprend le DDL énergie sans écraser les synthèses existantes', async () => {
				await connection.execute("UPDATE oko_resume_day SET conso_kwh = 12.34 ORDER BY jour LIMIT 1");
				const knex = createKnex(knexConfig);
				try {
					await addDailyEnergy(knex);
					await addDailyEnergy(knex);
				} finally {
					await knex.destroy();
				}
				const [rows] = await connection.query<RowDataPacket[]>(
					'SELECT conso_kwh FROM oko_resume_day ORDER BY jour LIMIT 1'
				);
				assert.equal(Number(rows[0].conso_kwh), 12.34);
				const [state] = await connection.query<RowDataPacket[]>('SELECT dirty FROM oko_energy_state WHERE id = 1');
				assert.equal(Number(state[0].dirty), 1);
				assert.deepEqual((await businessTotals())[0], before);
			});
			await t.test('refuse une colonne énergétique existante incompatible', async () => {
				await connection.query('ALTER TABLE oko_resume_day MODIFY prix_kg DECIMAL(8,2) NULL');
				const knex = createKnex(knexConfig);
				try {
					await assert.rejects(addDailyEnergy(knex), /prix_kg incompatible/);
				} finally {
					await knex.destroy();
					await connection.query('ALTER TABLE oko_resume_day MODIFY prix_kg DECIMAL(10,4) NULL');
				}
				assert.deepEqual((await businessTotals())[0], before);
			});
		});
	} finally {
		await connection.end();
		await rm(directory, { recursive: true, force: true });
	}
});
