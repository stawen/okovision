import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { createSiloEventsRepository, SiloEventError } from '../../src/lib/server/repositories/silo-events';

function repository() {
	const execute = vi.fn();
	const db = { execute } as Pick<Pool, 'execute'>;
	return { execute, events: createSiloEventsRepository(db) };
}

describe('gestion des événements de silo', () => {
	it('liste les événements par date décroissante avec leurs valeurs numériques', async () => {
		const { execute, events } = repository();
		execute.mockResolvedValueOnce([[
			{ id: 2, eventDate: '2025-01-03', quantity: '1200', remaining: '100', price: '400', eventType: 'PELLET' }
		]]);

		await expect(events.getEvents()).resolves.toEqual([{
			id: 2,
			eventDate: '2025-01-03',
			quantity: 1200,
			remaining: 100,
			price: 400,
			eventType: 'PELLET'
		}]);
		expect(execute.mock.calls[0][0]).toContain('ORDER BY event_date DESC, id DESC');
	});

	it('enregistre un remplissage avec ses quantités et son prix', async () => {
		const { execute, events } = repository();
		execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

		await events.createEvent({
			eventDate: '2025-01-03',
			eventType: 'PELLET',
			quantity: '1200',
			remaining: '100',
			price: '400'
		});

		expect(execute.mock.calls[0][1]).toEqual(['2025-01-03', 1200, 100, 400, 'PELLET']);
	});

	it('ignore les valeurs non applicables à un événement de cendrier', async () => {
		const { execute, events } = repository();
		execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

		await events.createEvent({
			eventDate: '2025-01-03',
			eventType: 'ASHES',
			quantity: 'not-used',
			remaining: 'not-used',
			price: 'not-used'
		});

		expect(execute.mock.calls[0][1]).toEqual(['2025-01-03', 0, 0, 0, 'ASHES']);
	});

	it('refuse un type d’événement inconnu avant écriture', async () => {
		const { execute, events } = repository();
		await expect(events.createEvent({
			eventDate: '2025-02-28',
			eventType: 'UNKNOWN',
			quantity: '10',
			remaining: '0',
			price: '0'
		})).rejects.toMatchObject({ code: 'invalid-input' });
		expect(execute).not.toHaveBeenCalled();
	});

	it('refuse une date impossible avant écriture', async () => {
		const { execute, events } = repository();
		await expect(events.createEvent({
			eventDate: '2025-02-29',
			eventType: 'MAINT',
			quantity: '0',
			remaining: '0',
			price: '0'
		})).rejects.toBeInstanceOf(SiloEventError);
		expect(execute).not.toHaveBeenCalled();
	});

	it('signale la modification d’un événement inexistant', async () => {
		const { execute, events } = repository();
		execute.mockResolvedValueOnce([[]]);

		await expect(events.updateEvent(8, {
			eventDate: '2025-01-03',
			eventType: 'MAINT',
			quantity: '0',
			remaining: '0',
			price: '100'
		})).rejects.toMatchObject({ code: 'event-not-found' });
		expect(execute).toHaveBeenCalledOnce();
	});

	it('met à jour un événement existant', async () => {
		const { execute, events } = repository();
		execute
			.mockResolvedValueOnce([[{ id: 8 }]])
			.mockResolvedValueOnce([{ affectedRows: 1 }]);

		await events.updateEvent(8, {
			eventDate: '2025-01-03',
			eventType: 'SWEEP',
			quantity: '0',
			remaining: '0',
			price: '120'
		});

		expect(execute.mock.calls[1][1]).toEqual(['2025-01-03', 0, 0, 120, 'SWEEP', 8]);
	});

	it('supprime un événement existant', async () => {
		const { execute, events } = repository();
		execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

		await events.deleteEvent(8);

		expect(execute.mock.calls[0][1]).toEqual([8]);
	});

	it('signale la suppression d’un événement inconnu', async () => {
		const { execute, events } = repository();
		execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

		await expect(events.deleteEvent(8)).rejects.toMatchObject({ code: 'event-not-found' });
		expect(execute.mock.calls[0][1]).toEqual([8]);
	});
});
