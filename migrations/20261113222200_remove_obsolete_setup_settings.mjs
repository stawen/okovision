/** @param {import('knex').Knex} knex */
export async function up(knex) {
	await knex('oko_configuration')
		.whereIn('param', ['getDataFromChaudiere', 'sendToWeb', 'lang'])
		.delete();
}

/** Removed values cannot be restored; keep them removed when rolling back. */
export async function down() {
	throw new Error('Removed configuration values cannot be restored.');
}
