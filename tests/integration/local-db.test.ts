import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createConnection, type RowDataPacket } from 'mysql2/promise';
import { createUsersRepository } from '../../src/lib/server/repositories/users.ts';

const fixture = readFileSync(new URL('../sql/okovision-dataset.sql', import.meta.url), 'utf8');
const dayMs = 86400000;
const shiftDate = (date: string, days: number) =>
	new Date(Date.parse(`${date}T00:00:00Z`) + days * dayMs).toISOString().slice(0, 10);

test('base Docker de test : dates coherentes et mesures preservees', async (t) => {
	assert.ok(process.env.DB_PASSWORD_FILE, 'DB_PASSWORD_FILE requis dans .env.dev');
	const connection = await createConnection({
		host: '127.0.0.1',
		port: Number(process.env.DEV_TEST_DB_PORT || 3308),
		database: 'okovision',
		user: 'okovision',
		password: readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').replace(/\r?\n$/, ''),
		dateStrings: true,
		timezone: 'Z'
	});
	try {
		const [clock] = await connection.query<RowDataPacket[]>('SELECT UTC_DATE() AS today');
		const today = String(clock[0].today);
		const yesterday = shiftDate(today, -1);
		const shiftDays = (Date.parse(yesterday) - Date.parse('2019-06-08')) / dayMs;

		await t.test('toutes les syntheses dans les cinq dernieres annees, sans changer les valeurs', async () => {
			const originals = [...fixture.matchAll(
				/\('(\d{4}-\d{2}-\d{2})', '(-?[\d.]+)', '(-?[\d.]+)', '([\d.]+)', '([\d.]+)', (\d+)\)/g
			)].sort((a, b) => a[1].localeCompare(b[1]));
			const [rows] = await connection.query<RowDataPacket[]>(
				'SELECT * FROM oko_resume_day ORDER BY jour'
			);
			assert.equal(rows.length, originals.length);
			assert.ok(rows.length > 0);
			assert.equal(rows.at(-1)?.jour, yesterday);
			const [bounds] = await connection.query<RowDataPacket[]>(
				'SELECT DATE_SUB(UTC_DATE(), INTERVAL 5 YEAR) AS earliest'
			);
			assert.ok(String(rows[0].jour) >= String(bounds[0].earliest));
			for (const [index, original] of originals.entries()) {
				const row = rows[index];
				assert.equal(row.jour, shiftDate(original[1], shiftDays));
				assert.deepEqual(
					[row.tc_ext_max, row.tc_ext_min, row.conso_kg, row.dju, row.nb_cycle].map(Number),
					original.slice(2).map(Number)
				);
				assert.equal(row.conso_ecs_kg, null);
			}
		});

		await t.test('evenements silo, saisons et configuration decales ensemble', async () => {
			const events = [...fixture.matchAll(
				/\((\d+), '(\d{4}-\d{2}-\d{2})', (\d+), (\d+), (\d+), '(PELLET|ASHES|BAG)'\)/g
			)];
			const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM oko_silo_events ORDER BY id');
			assert.equal(rows.length, events.length);
			assert.ok(rows.length > 0);
			for (const [index, original] of events.entries()) {
				assert.deepEqual(
					[rows[index].id, rows[index].event_date, rows[index].quantity,
						rows[index].remaining, rows[index].price, rows[index].event_type],
					[Number(original[1]), shiftDate(original[2], shiftDays),
						Number(original[3]), Number(original[4]), Number(original[5]), original[6]]
				);
			}
			const seasons = [...fixture.matchAll(
				/\((\d+), '\d{4}-\d{4}', '(\d{4}-\d{2}-\d{2})', '(\d{4}-\d{2}-\d{2})'\)/g
			)];
			const [seasonRows] = await connection.query<RowDataPacket[]>('SELECT * FROM oko_saisons ORDER BY id');
			assert.equal(seasonRows.length, seasons.length);
			for (const [index, original] of seasons.entries()) {
				const start = shiftDate(original[2], shiftDays);
				const end = shiftDate(original[3], shiftDays);
				assert.equal(seasonRows[index].date_debut, start);
				assert.equal(seasonRows[index].date_fin, end);
				assert.equal(seasonRows[index].saison, `${start.slice(0, 4)}-${end.slice(0, 4)}`);
			}
			const timestamps = [...fixture.matchAll(/\((\d{10}), '/g)].map((match) => Number(match[1]));
			const [boilerRows] = await connection.query<RowDataPacket[]>('SELECT timestamp FROM oko_boiler ORDER BY timestamp');
			assert.deepEqual(boilerRows.map((row) => row.timestamp), timestamps.map((value) => value + shiftDays * 86400));
		});

		await t.test('connexion admin avec le mot de passe de demonstration', async () => {
			const users = createUsersRepository(connection);
			assert.deepEqual(await users.authenticate('admin', 'okouser'), {
				id: 1, name: 'admin', type: 'admin'
			});
			assert.equal(await users.authenticate('admin', 'mot-de-passe-incorrect'), null);
		});

		await t.test('pas de mesures detaillees inventees', async () => {
			const [rows] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM oko_historique_full');
			assert.equal(rows[0].count, 0);
			const [missing] = await connection.query<RowDataPacket[]>(
				'SELECT COUNT(*) AS count FROM oko_resume_day r LEFT JOIN oko_dateref d ON d.jour = r.jour WHERE d.jour IS NULL'
			);
			assert.equal(missing[0].count, 0);
		});
	} finally {
		await connection.end();
	}
});
