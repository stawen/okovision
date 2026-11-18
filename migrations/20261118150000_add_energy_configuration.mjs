/** @param {import('knex').Knex} knex */
export async function up(knex) {
	await knex('oko_configuration')
		.insert([
			{ param: 'pciPellet', value: '4.90' },
			{ param: 'rendementChaudiere', value: '89.50' }
		])
		.onConflict('param').ignore();
}

export async function down() {
	// Preserve configuration values, including those that existed before this migration.
}

export const config = { transaction: false };
