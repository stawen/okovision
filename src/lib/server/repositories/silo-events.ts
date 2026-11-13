import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

interface SiloEventRow extends RowDataPacket {
	id: number;
	eventDate: string;
	quantity: number | string;
	remaining: number | string;
	price: number | string;
	eventType: string;
}

export const siloEventTypes = ['PELLET', 'ASHES', 'MAINT', 'SWEEP', 'BAG'] as const;
export type SiloEventType = (typeof siloEventTypes)[number];

export interface ManagedSiloEvent {
	id: number;
	eventDate: string;
	quantity: number;
	remaining: number;
	price: number;
	eventType: SiloEventType;
}

export interface SiloEventInput {
	eventDate: string;
	eventType: string;
	quantity: string;
	remaining: string;
	price: string;
}

export type SiloEventErrorCode = 'invalid-input' | 'event-not-found';

export class SiloEventError extends Error {
	constructor(readonly code: SiloEventErrorCode) {
		super(code);
	}
}

function isSiloEventType(value: string): value is SiloEventType {
	return siloEventTypes.some((type) => type === value);
}

function requireId(value: number): number {
	if (!Number.isSafeInteger(value) || value <= 0) throw new SiloEventError('invalid-input');
	return value;
}

function requireDate(value: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) throw new SiloEventError('invalid-input');
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (year < 1000 || year > 9999 || date.getUTCFullYear() !== year
		|| date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		throw new SiloEventError('invalid-input');
	}
	return value;
}

function requireInteger(value: string, maximum: number): number {
	if (!/^\d+$/.test(value)) throw new SiloEventError('invalid-input');
	const number = Number(value);
	if (!Number.isSafeInteger(number) || number > maximum) throw new SiloEventError('invalid-input');
	return number;
}

function requireEvent(input: SiloEventInput) {
	if (!isSiloEventType(input.eventType)) {
		throw new SiloEventError('invalid-input');
	}

	const eventType = input.eventType;
	const eventDate = requireDate(input.eventDate);
	const quantity = eventType === 'PELLET' || eventType === 'BAG'
		? requireInteger(input.quantity, 4_294_967_295)
		: 0;
	const remaining = eventType === 'PELLET' ? requireInteger(input.remaining, 2_147_483_647) : 0;
	const price = eventType !== 'ASHES' ? requireInteger(input.price, 2_147_483_647) : 0;
	if ((eventType === 'PELLET' || eventType === 'BAG') && quantity === 0) {
		throw new SiloEventError('invalid-input');
	}
	return { eventDate, eventType, quantity, remaining, price };
}

export function createSiloEventsRepository(db: Pick<Pool, 'execute'>) {
	async function getEvent(id: number): Promise<SiloEventRow | undefined> {
		const [rows] = await db.execute<SiloEventRow[]>(
			`SELECT id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
				quantity, remaining, price, event_type AS eventType
			 FROM oko_silo_events WHERE id = ?`,
			[id]
		);
		return rows[0];
	}

	return {
		async getEvents(): Promise<ManagedSiloEvent[]> {
			const [rows] = await db.execute<SiloEventRow[]>(
				`SELECT id, DATE_FORMAT(event_date, '%Y-%m-%d') AS eventDate,
					quantity, remaining, price, event_type AS eventType
				 FROM oko_silo_events ORDER BY event_date DESC, id DESC`
			);
			return rows.map((row) => {
				if (!isSiloEventType(row.eventType)) throw new Error('Invalid stored silo event type');
				return {
					id: row.id,
					eventDate: row.eventDate,
					quantity: Number(row.quantity),
					remaining: Number(row.remaining),
					price: Number(row.price),
					eventType: row.eventType
				};
			});
		},

		async createEvent(input: SiloEventInput): Promise<void> {
			const event = requireEvent(input);
			await db.execute(
				`INSERT INTO oko_silo_events (event_date, quantity, remaining, price, event_type)
				 VALUES (?, ?, ?, ?, ?)`,
				[event.eventDate, event.quantity, event.remaining, event.price, event.eventType]
			);
		},

		async updateEvent(idValue: number, input: SiloEventInput): Promise<void> {
			const id = requireId(idValue);
			const event = requireEvent(input);
			if (!await getEvent(id)) throw new SiloEventError('event-not-found');
			await db.execute(
				`UPDATE oko_silo_events
				 SET event_date = ?, quantity = ?, remaining = ?, price = ?, event_type = ?
				 WHERE id = ?`,
				[event.eventDate, event.quantity, event.remaining, event.price, event.eventType, id]
			);
		},

		async deleteEvent(idValue: number): Promise<void> {
			const id = requireId(idValue);
			const [result] = await db.execute<ResultSetHeader>(
				'DELETE FROM oko_silo_events WHERE id = ?',
				[id]
			);
			if (!result.affectedRows) throw new SiloEventError('event-not-found');
		}
	};
}
