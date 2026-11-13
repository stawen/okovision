import { resolve } from 'node:path';
import { databaseOptions } from './src/lib/server/database.ts';

/** @type {import('knex').Knex.Config} */
const config = {
	client: 'mysql2',
	get connection() {
		return databaseOptions(process.env);
	},
	pool: { min: 0, max: 1 },
	migrations: {
		directory: resolve('migrations'),
		extension: 'mjs',
		loadExtensions: ['.mjs'],
		stub: resolve('scripts/migration.stub'),
		tableName: 'knex_migrations'
	}
};

export default config;
