import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

interface SeasonRow extends RowDataPacket {
	id: number;
	name: string;
	startDate: string;
	endDate: string;
}

export interface ManagedSeason {
	id: number;
	name: string;
	startDate: string;
	endDate: string;
}

export type SeasonErrorCode = 'invalid-input' | 'duplicate-season' | 'season-not-found';

export class SeasonError extends Error {
	constructor(readonly code: SeasonErrorCode) {
		super(code);
	}
}

function requireId(value: number): number {
	if (!Number.isSafeInteger(value) || value <= 0) throw new SeasonError('invalid-input');
	return value;
}

function getSeasonDates(value: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) throw new SeasonError('invalid-input');
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	if (year < 1000 || year > 9998) throw new SeasonError('invalid-input');

	const start = new Date(Date.UTC(year, month - 1, day));
	if (start.getUTCFullYear() !== year || start.getUTCMonth() !== month - 1 || start.getUTCDate() !== day) {
		throw new SeasonError('invalid-input');
	}
	const end = new Date(Date.UTC(year + 1, month - 1, day));
	end.setUTCDate(end.getUTCDate() - 1);
	const endDate = end.toISOString().slice(0, 10);

	return {
		name: `${year}-${end.getUTCFullYear()}`,
		startDate: value,
		endDate
	};
}

export function createSeasonsRepository(db: Pick<Pool, 'execute'>) {
	async function getSeasons(): Promise<ManagedSeason[]> {
		const [rows] = await db.execute<SeasonRow[]>(
			'SELECT id, saison AS name, date_debut AS startDate, date_fin AS endDate FROM oko_saisons ORDER BY date_debut'
		);
		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			startDate: row.startDate,
			endDate: row.endDate
		}));
	}

	async function assertStartDateAvailable(startDate: string, exceptId?: number): Promise<void> {
		const [rows] = await db.execute<SeasonRow[]>(
			`SELECT id, saison AS name, date_debut AS startDate, date_fin AS endDate
			 FROM oko_saisons WHERE date_debut = ?${exceptId === undefined ? '' : ' AND id <> ?'} LIMIT 1`,
			exceptId === undefined ? [startDate] : [startDate, exceptId]
		);
		if (rows.length) throw new SeasonError('duplicate-season');
	}

	return {
		getSeasons,

		async createSeason(startDateValue: string): Promise<void> {
			const season = getSeasonDates(startDateValue);
			await assertStartDateAvailable(season.startDate);
			await db.execute(
				'INSERT INTO oko_saisons (saison, date_debut, date_fin) VALUES (?, ?, ?)',
				[season.name, season.startDate, season.endDate]
			);
		},

		async updateSeason(idValue: number, startDateValue: string): Promise<void> {
			const id = requireId(idValue);
			const season = getSeasonDates(startDateValue);
			const [existing] = await db.execute<SeasonRow[]>(
				'SELECT id, saison AS name, date_debut AS startDate, date_fin AS endDate FROM oko_saisons WHERE id = ?',
				[id]
			);
			if (!existing.length) throw new SeasonError('season-not-found');
			await assertStartDateAvailable(season.startDate, id);
			await db.execute(
				'UPDATE oko_saisons SET saison = ?, date_debut = ?, date_fin = ? WHERE id = ?',
				[season.name, season.startDate, season.endDate, id]
			);
		},

		async deleteSeason(idValue: number): Promise<void> {
			const id = requireId(idValue);
			const [result] = await db.execute<ResultSetHeader>(
				'DELETE FROM oko_saisons WHERE id = ?',
				[id]
			);
			if (!result.affectedRows) throw new SeasonError('season-not-found');
		}
	};
}
