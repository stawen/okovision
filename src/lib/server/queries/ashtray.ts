import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getMessages } from '../messages.ts';

interface EmptyingRow extends RowDataPacket {
	last_emptying: string | null;
}

interface ConsumptionRow extends RowDataPacket {
	consumption: string | number | null;
}

export type AshtrayStatus = 'no-emptying' | 'no-consumption' | 'full' | 'ok';

export async function getAshtrayStatus(pool: Pick<Pool, 'execute'>, capacity: number): Promise<AshtrayStatus> {
	const [events] = await pool.execute<EmptyingRow[]>(
		"SELECT MAX(event_date) AS last_emptying FROM oko_silo_events WHERE event_type = 'ASHES'"
	);
	if (!events[0]) throw new Error(getMessages().ashtrayNoResult);
	if (!events[0].last_emptying) return 'no-emptying';

	const [rows] = await pool.execute<ConsumptionRow[]>(
		'SELECT SUM(conso_kg) AS consumption FROM oko_resume_day WHERE jour > ?',
		[events[0].last_emptying]
	);
	if (!rows[0]) throw new Error(getMessages().ashtrayNoResult);
	if (rows[0].consumption === null) return 'no-consumption';
	const consumption = Number(rows[0].consumption);
	if (!Number.isFinite(consumption)) throw new Error(getMessages().invalidAshtrayConsumption);
	return consumption >= capacity ? 'full' : 'ok';
}
