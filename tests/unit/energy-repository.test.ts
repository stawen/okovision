import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createEnergyRepository } from '../../src/lib/server/repositories/energy';

function database(initial: 'unavailable' | 'dirty' | 'ready' = 'ready') {
	let state = initial === 'ready' ? 0 : 1;
	const rows = [
		{ day: '2026-01-01', consumption: '2', cycles: 1 },
		{ day: '2026-01-02', consumption: '3', cycles: 2 }
	];
	const written: unknown[][] = [];
	let failWrite = false;
	const execute = vi.fn(async (sql: string, values: unknown[] = []) => {
		if (sql.includes('information_schema.TABLES')) return [[{ count: initial === 'unavailable' ? 0 : 1 }]];
		if (sql.startsWith('SELECT dirty')) return [[{ dirty: state }]];
		if (sql.startsWith('UPDATE oko_energy_state')) {
			state = Number(values[0]);
			return [{ affectedRows: 1 }];
		}
		if (sql.includes('FROM oko_configuration')) return [[
			{ param: 'pciPellet', value: '5' }, { param: 'rendementChaudiere', value: '90' }
		]];
		if (sql.includes('FROM oko_resume_day ORDER BY')) return [rows];
		if (sql.includes('FROM oko_silo_events')) return [[
			{ id: 1, day: '2026-01-01', quantity: 10, price: 4 }
		]];
		if (sql.startsWith('UPDATE oko_resume_day')) {
			if (failWrite) throw new Error('interrupted');
			written.push(values);
			return [{ affectedRows: 1 }];
		}
		throw new Error(`Unexpected SQL: ${sql}`);
	});
	const repository = createEnergyRepository({ execute } as unknown as Pick<Pool, 'execute'>);
	return { repository, execute, written, rows, getState: () => state, fail: () => { failWrite = true; }, recover: () => { failWrite = false; } };
}

describe('reprise énergétique', () => {
	it('simule sans écriture et recalcule les synthèses dans l’ordre', async () => {
		const db = database();
		const result = await db.repository.calculate();
		expect(result.summaries.map((row) => row.cumulativeEnergy)).toEqual([9, 22.5]);
		expect(db.written).toEqual([]);
		await db.repository.rebuild(new AbortController().signal);
		expect(db.written.map((row) => row.at(-1))).toEqual(['2026-01-01', '2026-01-02']);
		expect(db.getState()).toBe(0);
	});

	it('masque les données après une interruption et permet une reprise complète', async () => {
		const db = database();
		db.fail();
		await expect(db.repository.rebuild(new AbortController().signal)).rejects.toThrow('interrupted');
		expect(db.getState()).toBe(1);
		await expect(db.repository.status()).resolves.toBe('dirty');
		db.recover();
		await db.repository.rebuild(new AbortController().signal);
		expect(db.getState()).toBe(0);
		expect(db.written).toHaveLength(2);
	});

	it('recalcule après correction, mais conserve un état déjà sale sans reprise implicite', async () => {
		const db = database();
		await db.repository.mutate(new AbortController().signal, async () => { db.rows[0].consumption = '4'; });
		expect(db.written[1][2]).toBe(31.5);
		const dirty = database('dirty');
		await dirty.repository.mutate(new AbortController().signal, async () => 'saved');
		expect(dirty.written).toEqual([]);
		expect(dirty.getState()).toBe(1);
	});

	it('préserve les écritures legacy sans migration et reste sale après erreur de mutation', async () => {
		const legacy = database('unavailable');
		await expect(legacy.repository.mutate(new AbortController().signal, async () => 'saved')).resolves.toBe('saved');
		expect(legacy.execute).toHaveBeenCalledOnce();
		const db = database();
		await expect(db.repository.mutate(new AbortController().signal, async () => {
			throw new Error('write failed');
		})).rejects.toThrow('write failed');
		expect(db.getState()).toBe(1);
	});

	it('conserve les résultats après un refus sans écriture et marque sale un recalcul annulé', async () => {
		const db = database();
		const error = new Error('invalid input');
		await expect(db.repository.mutate(new AbortController().signal, async () => {
			throw error;
		}, (cause) => cause === error)).rejects.toBe(error);
		expect(db.getState()).toBe(0);
		const controller = new AbortController();
		controller.abort();
		await expect(db.repository.rebuild(controller.signal)).rejects.toThrow();
		expect(db.getState()).toBe(1);
	});
});
