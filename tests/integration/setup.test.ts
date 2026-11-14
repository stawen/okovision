import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createConnection, type RowDataPacket } from 'mysql2/promise';
import { configurationParameters, type ConfigurationValues } from '../../src/lib/configuration.ts';
import { databaseOptions } from '../../src/lib/server/database.ts';
import { completeSetup, getSetupStatus, SetupError } from '../../src/lib/server/setup.ts';
import { createUsersRepository } from '../../src/lib/server/repositories/users.ts';

test('post-installation sur la base Docker vierge dédiée', async (t) => {
	process.env.DB_ADRESSE = `127.0.0.1:${process.env.DEV_SETUP_TEST_DB_PORT || 3310}`;
	const connection = await createConnection(databaseOptions(process.env));
	const values: ConfigurationValues = {
		chaudiere: '192.168.1.23', tcRef: '20', poidsPellet: '150', surfaceMaison: '120',
		timezone: 'Europe/Paris', hasSilo: '0', siloSize: '', ashtray: ''
	};
	const password = 'setup-test-private-password';
	try {
		assert.equal(await getSetupStatus(connection), 'install');
		const [tables] = await connection.query<RowDataPacket[]>('SHOW TABLES');
		assert.equal(tables.length, 0, 'utiliser uniquement db-setup-test fraîchement créée');

		await t.test('refuse un compte sans mot de passe choisi avant toute installation', async () => {
			await assert.rejects(completeSetup(values, '', false), (error) =>
				error instanceof SetupError && error.code === 'invalid');
			assert.equal((await connection.query<RowDataPacket[]>('SHOW TABLES'))[0].length, 0);
		});

		await t.test('installe une base réellement vierge sans confirmation forcée', async () => {
			await completeSetup(values, password, false);
			assert.equal(await getSetupStatus(connection), 'ready');
			const users = createUsersRepository(connection);
			assert.equal((await users.authenticate('admin', password))?.type, 'admin');
			assert.ok(await users.getAdminBoilerCredentials());
			const [admins] = await connection.execute<RowDataPacket[]>(
				'SELECT pass FROM oko_user WHERE user = ?', ['admin']
			);
			assert.equal(admins.length, 1);
			assert.match(admins[0].pass, /^scrypt\$/);
		});

		await t.test('protège une base partielle sans confirmation destructive', async () => {
			await connection.query('DROP TABLE oko_capteur');
			await connection.execute("INSERT INTO oko_resume_day (jour, conso_kg) VALUES ('2026-01-01', 123)");
			assert.equal(await getSetupStatus(connection), 'partial');
			await assert.rejects(completeSetup(values, password, false), (error) =>
				error instanceof SetupError && error.code === 'force-required');
			assert.equal((await connection.query<RowDataPacket[]>('SELECT conso_kg FROM oko_resume_day'))[0][0].conso_kg, '123.00');
		});

		await t.test('installe explicitement le SQL et le nouveau compte sans mesures de démonstration', async () => {
			await completeSetup(values, password, true);
			assert.equal(await getSetupStatus(connection), 'ready');
			const [columns] = await connection.query<RowDataPacket[]>('SHOW COLUMNS FROM oko_configuration');
			assert.deepEqual(columns.map((column) => column.Field), ['param', 'value']);
			const [rows] = await connection.query<RowDataPacket[]>('SELECT param, value FROM oko_configuration');
			assert.deepEqual(rows.map((row) => row.param).sort(), [...configurationParameters].sort());
			assert.equal(rows.find((row) => row.param === 'surfaceMaison')?.value, '120');
			const users = createUsersRepository(connection);
			assert.equal((await users.authenticate('admin', password))?.type, 'admin');
			assert.equal(await users.authenticate('admin', 'okouser'), null);
			assert.ok(await users.getAdminBoilerCredentials());
			for (const table of ['oko_resume_day', 'oko_historique_full']) {
				assert.equal((await connection.query<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${table}`))[0][0].count, 0);
			}
		});

		await t.test('refuse une seconde installation et préserve les données', async () => {
			await connection.execute("INSERT INTO oko_resume_day (jour, conso_kg) VALUES ('2026-01-02', 10)");
			await assert.rejects(completeSetup(values, password, true), (error) =>
				error instanceof SetupError && error.code === 'complete');
			assert.equal((await connection.query<RowDataPacket[]>('SELECT conso_kg FROM oko_resume_day'))[0][0].conso_kg, '10.00');
		});

		await t.test('complète une surface vide sans réinstaller et respecte le verrou concurrent', async () => {
			const boilerCredentials = { username: 'setup-boiler-user', password: 'setup-boiler-password' };
			await connection.execute(
				'UPDATE oko_user SET login_boiler = ?, pass_boiler = ? WHERE user = ?',
				[boilerCredentials.username, Buffer.from(boilerCredentials.password).toString('base64'), 'admin']
			);
			await connection.execute("UPDATE oko_configuration SET value = '' WHERE param = 'surfaceMaison'");
			assert.equal(await getSetupStatus(connection), 'configure');
			await connection.query("SELECT GET_LOCK(CONCAT(DATABASE(), ':setup'), 0)");
			try {
				await assert.rejects(completeSetup(values, '', false), (error) =>
					error instanceof SetupError && error.code === 'busy');
			} finally {
				await connection.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':setup'))");
			}
			await completeSetup(values, '', false);
			assert.equal(await getSetupStatus(connection), 'ready');
			assert.equal((await connection.query<RowDataPacket[]>('SELECT conso_kg FROM oko_resume_day'))[0][0].conso_kg, '10.00');
			assert.equal((await createUsersRepository(connection).authenticate('admin', password))?.type, 'admin');
			await connection.execute('DELETE FROM oko_configuration');
			assert.equal(await getSetupStatus(connection), 'configure');
			await completeSetup(values, '', false);
			assert.equal(await getSetupStatus(connection), 'ready');
			assert.equal((await connection.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM oko_configuration'))[0][0].count, 8);
			assert.equal((await connection.query<RowDataPacket[]>('SELECT conso_kg FROM oko_resume_day'))[0][0].conso_kg, '10.00');
			assert.deepEqual(await createUsersRepository(connection).getAdminBoilerCredentials(), boilerCredentials);
		});
	} finally {
		await connection.end();
	}
});
