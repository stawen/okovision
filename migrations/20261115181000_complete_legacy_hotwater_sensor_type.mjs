/** @param {import('knex').Knex} knex */
export async function up(knex) {
	await knex('oko_capteur')
		.where('original_name', 'WW1 Pumpe')
		.where(function () {
			this.whereNull('type').orWhere('type', '');
		})
		.update({ type: 'hotwater[0]' });
}

/** The previous type cannot be distinguished from an already configured type. */
export async function down() {
	throw new Error('Previous hotwater sensor types cannot be restored safely.');
}

export const config = { transaction: false };
