const columns = [
	{ name: 'conso_kwh', type: 'decimal', precision: 10, scale: 2 },
	{ name: 'cumul_kg', type: 'decimal', precision: 10, scale: 2 },
	{ name: 'cumul_kwh', type: 'decimal', precision: 10, scale: 2 },
	{ name: 'cumul_cycle', type: 'int', unsigned: true },
	{ name: 'prix_kg', type: 'decimal', precision: 10, scale: 4 },
	{ name: 'prix_kwh', type: 'decimal', precision: 10, scale: 4 },
	{ name: 'cumul_partiel', type: 'tinyint' }
];

/** @param {import('knex').Knex} knex */
export async function up(knex) {
	if (!await knex.schema.hasTable('oko_resume_day')) throw new Error('Table oko_resume_day absente.');
	for (const column of columns) {
		const existing = await knex('information_schema.COLUMNS')
			.select('DATA_TYPE', 'NUMERIC_PRECISION', 'NUMERIC_SCALE', 'IS_NULLABLE', 'COLUMN_TYPE')
			.whereRaw('TABLE_SCHEMA = DATABASE()')
			.where({ TABLE_NAME: 'oko_resume_day', COLUMN_NAME: column.name })
			.first();
		if (existing) {
			if (existing.DATA_TYPE !== column.type || existing.IS_NULLABLE !== 'YES'
				|| (column.precision !== undefined && Number(existing.NUMERIC_PRECISION) !== column.precision)
				|| (column.scale !== undefined && Number(existing.NUMERIC_SCALE) !== column.scale)
				|| (column.unsigned && !String(existing.COLUMN_TYPE).includes('unsigned'))) {
				throw new Error(`Colonne oko_resume_day.${column.name} incompatible.`);
			}
			continue;
		}
		await knex.schema.alterTable('oko_resume_day', (table) => {
			if (column.type === 'decimal') table.decimal(column.name, column.precision, column.scale).nullable();
			else if (column.unsigned) table.integer(column.name).unsigned().nullable();
			else table.specificType(column.name, 'TINYINT').nullable();
		});
	}

	if (!await knex.schema.hasTable('oko_energy_state')) {
		await knex.schema.createTable('oko_energy_state', (table) => {
			table.engine('InnoDB');
			table.specificType('id', 'TINYINT UNSIGNED').primary();
			table.specificType('dirty', 'TINYINT UNSIGNED').notNullable();
		});
	}
	const [table] = await knex('information_schema.TABLES')
		.select('ENGINE')
		.whereRaw('TABLE_SCHEMA = DATABASE()')
		.where({ TABLE_NAME: 'oko_energy_state' });
	const info = await knex('information_schema.COLUMNS')
		.select('COLUMN_NAME', 'DATA_TYPE', 'COLUMN_TYPE', 'IS_NULLABLE')
		.whereRaw('TABLE_SCHEMA = DATABASE()')
		.where({ TABLE_NAME: 'oko_energy_state' });
	if (table?.ENGINE?.toLowerCase() !== 'innodb' || info.length !== 2
		|| !['id', 'dirty'].every((name) => info.some((column) =>
			column.COLUMN_NAME === name && column.DATA_TYPE === 'tinyint'
			&& String(column.COLUMN_TYPE).includes('unsigned') && column.IS_NULLABLE === 'NO'
		))) throw new Error('Table oko_energy_state incompatible.');
	const [primary] = await knex.raw("SHOW KEYS FROM oko_energy_state WHERE Key_name = 'PRIMARY'");
	if (primary.length !== 1 || primary[0].Column_name !== 'id') {
		throw new Error('Cle primaire oko_energy_state incompatible.');
	}
	await knex('oko_energy_state').insert({ id: 1, dirty: 1 }).onConflict('id').merge({ dirty: 1 });
}

export async function down() {
	throw new Error('Retour arrière manuel : les colonnes peuvent contenir des données préexistantes.');
}

export const config = { transaction: false };
