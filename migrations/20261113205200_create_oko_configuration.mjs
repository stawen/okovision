import { configurationParameters } from '../src/lib/configuration.ts';

/** @param {import('knex').Knex} knex */
export async function up(knex) {
	if (!await knex.schema.hasTable('oko_configuration')) {
		await knex.schema.createTable('oko_configuration', (table) => {
			table.engine('InnoDB');
			table.string('param', 100).primary();
			table.text('value').nullable();
		});
	}
	const columns = await knex('oko_configuration').columnInfo();
	if (Object.keys(columns).length !== 2 || !columns.param || !columns.value) {
		throw new Error('Schema oko_configuration incompatible.');
	}
	const [primary] = await knex.raw("SHOW KEYS FROM oko_configuration WHERE Key_name = 'PRIMARY'");
	if (primary.length === 0) {
		await knex.schema.alterTable('oko_configuration', (table) => table.primary('param'));
	} else if (primary.length !== 1 || primary[0].Column_name !== 'param') {
		throw new Error('Cle primaire oko_configuration incompatible.');
	}
	await knex('oko_configuration')
		.insert(configurationParameters.map((param) => ({ param, value: '' })))
		.onConflict('param').ignore();
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
	await knex.schema.dropTable('oko_configuration');
}

export const config = { transaction: false };
