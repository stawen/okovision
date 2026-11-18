import { describe, expect, it, vi } from 'vitest';
import type { Knex } from 'knex';
import { up } from '../../migrations/20261118153000_add_daily_energy.mjs';

function migrationDatabase(existing: boolean) {
	let stateExists = existing;
	const primary = vi.fn();
	const notNullable = vi.fn();
	const engine = vi.fn();
	const specificType = vi.fn(() => ({ primary, notNullable }));
	const createTable = vi.fn(async (_name: string, build: (table: object) => void) => {
		build({ engine, specificType });
		stateExists = true;
	});
	const merge = vi.fn();
	const knex = Object.assign((name: string) => {
		let filter: Record<string, string> = {};
		const builder = {
			select: () => builder,
			whereRaw: () => builder,
			where: (values: Record<string, string>) => { filter = values; return builder; },
			first: async () => ({
				DATA_TYPE: filter.COLUMN_NAME === 'cumul_cycle' ? 'int'
					: filter.COLUMN_NAME === 'cumul_partiel' ? 'tinyint' : 'decimal',
				NUMERIC_PRECISION: 10,
				NUMERIC_SCALE: filter.COLUMN_NAME?.startsWith('prix_') ? 4 : 2,
				IS_NULLABLE: 'YES', COLUMN_TYPE: 'int unsigned'
			}),
			then: (resolve: (rows: object[]) => void) => {
				const rows = name === 'information_schema.TABLES'
					? [{ ENGINE: 'InnoDB' }]
					: ['id', 'dirty'].map((column) => ({
						COLUMN_NAME: column, DATA_TYPE: 'tinyint', COLUMN_TYPE: 'tinyint unsigned', IS_NULLABLE: 'NO'
					}));
				return Promise.resolve(rows).then(resolve);
			},
			insert: (row: object) => {
				expect(row).toEqual({ id: 1, dirty: 1 });
				return { onConflict: (key: string) => {
					expect(key).toBe('id');
					return { merge };
				} };
			}
		};
		return builder;
	}, {
		schema: {
			hasTable: async (name: string) => name === 'oko_resume_day' || stateExists,
			createTable
		},
		raw: async () => [[{ Column_name: 'id' }]]
	});
	return { knex: knex as unknown as Knex, createTable, engine, specificType, primary, notNullable, merge };
}

describe('migration de l’état énergétique', () => {
	it('crée et initialise la table absente', async () => {
		const db = migrationDatabase(false);
		await up(db.knex);
		expect(db.createTable).toHaveBeenCalledOnce();
		expect(db.createTable).toHaveBeenCalledWith('oko_energy_state', expect.any(Function));
		expect(db.engine).toHaveBeenCalledWith('InnoDB');
		expect(db.specificType).toHaveBeenCalledWith('id', 'TINYINT UNSIGNED');
		expect(db.specificType).toHaveBeenCalledWith('dirty', 'TINYINT UNSIGNED');
		expect(db.primary).toHaveBeenCalledOnce();
		expect(db.notNullable).toHaveBeenCalledOnce();
		expect(db.merge).toHaveBeenCalledWith({ dirty: 1 });
	});

	it('conserve une table compatible existante et demande une reprise', async () => {
		const db = migrationDatabase(true);
		await up(db.knex);
		expect(db.createTable).not.toHaveBeenCalled();
		expect(db.merge).toHaveBeenCalledWith({ dirty: 1 });
	});
});
