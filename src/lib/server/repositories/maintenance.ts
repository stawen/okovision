import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getMessages } from '../messages.ts';

interface EmptyingRow extends RowDataPacket {
	lastEmptying: string | null;
}

interface ConsumptionRow extends RowDataPacket {
	consumption: string | number | null;
}

interface FillRow extends RowDataPacket {
	eventDate: string;
	pelletQuantity: string | number;
}

export type AshtrayStatus = 'no-emptying' | 'no-consumption' | 'full' | 'ok';
export type StockStatus =
	| { status: 'unavailable' | 'no-fill' | 'no-consumption' }
	| { status: 'available'; remains: number; percent: number };

export function createMaintenanceRepository(db: Pick<Pool, 'execute'>) {
	return {
		/** Estimates remaining pellets from the latest fill and later daily consumption; missing inputs stay unavailable. */
		async getStockStatus(hasSilo: boolean | null, siloSize: number | null): Promise<StockStatus> {
			if (hasSilo === null || (hasSilo && siloSize === null)) return { status: 'unavailable' };
			const [events] = await db.execute<FillRow[]>(
				`SELECT event_date AS eventDate, quantity + remaining AS pelletQuantity FROM oko_silo_events
				 WHERE event_type = ? ORDER BY event_date DESC, id DESC LIMIT 1`,
				[hasSilo ? 'PELLET' : 'BAG']
			);
			const event = events[0];
			if (!event) return { status: 'no-fill' };
			const quantity = Number(event.pelletQuantity);
			if (!Number.isFinite(quantity)) throw new Error(getMessages().invalidIndicator);
			const [rows] = await db.execute<ConsumptionRow[]>(
				'SELECT SUM(conso_kg) AS consumption FROM oko_resume_day WHERE jour > ?',
				[event.eventDate]
			);
			if (!rows[0]) throw new Error(getMessages().stockNoResult);
			if (rows[0].consumption === null) return { status: 'no-consumption' };
			const consumption = Number(rows[0].consumption);
			if (!Number.isFinite(consumption)) throw new Error(getMessages().invalidIndicator);
			const capacity = hasSilo ? siloSize : quantity;
			if (capacity === null || capacity <= 0) return { status: 'unavailable' };
			const remains = Math.round(quantity - consumption);
			return { status: 'available', remains, percent: Math.round(100 * remains / capacity) };
		},

		/** Estimates ashtray fullness only from consumption recorded since the latest emptying event. */
		async getAshtrayStatus(capacity: number): Promise<AshtrayStatus> {
			const [events] = await db.execute<EmptyingRow[]>(
				"SELECT MAX(event_date) AS lastEmptying FROM oko_silo_events WHERE event_type = 'ASHES'"
			);
			if (!events[0]) throw new Error(getMessages().ashtrayNoResult);
			if (!events[0].lastEmptying) return 'no-emptying';

			const [rows] = await db.execute<ConsumptionRow[]>(
				'SELECT SUM(conso_kg) AS consumption FROM oko_resume_day WHERE jour > ?',
				[events[0].lastEmptying]
			);
			if (!rows[0]) throw new Error(getMessages().ashtrayNoResult);
			if (rows[0].consumption === null) return 'no-consumption';
			const consumption = Number(rows[0].consumption);
			if (!Number.isFinite(consumption)) throw new Error(getMessages().invalidAshtrayConsumption);
			return consumption >= capacity ? 'full' : 'ok';
		}
	};
}
