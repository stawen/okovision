import type { Pool, RowDataPacket } from 'mysql2/promise';
import { getMessages } from '../messages.ts';

interface YearRow extends RowDataPacket {
	year: number;
}

interface SeasonRow extends RowDataPacket {
	id: number;
	name: string;
	startDate: string;
	endDate: string;
}

interface MonthlyReadingRow extends RowDataPacket {
	day: number;
	tcExtMax: string | number | null;
	tcExtMin: string | number | null;
	consoKg: string | number | null;
	consoKwh: string | number | null;
	dju: string | number | null;
	nbCycle: string | number | null;
}

interface SeasonReadingRow extends RowDataPacket {
	year: number;
	month: number;
	sampleCount: number;
	tcExtMax: string | number | null;
	tcExtMin: string | number | null;
	consoKg: string | number | null;
	consoEcsKg: string | number | null;
	consoKwh: string | number | null;
	energyCount: number | string;
	dju: string | number | null;
	nbCycle: string | number | null;
}

interface TotalRow extends RowDataPacket {
	sampleCount: number;
	tcExtMax: string | number | null;
	tcExtMin: string | number | null;
	consoKg: string | number | null;
	consoEcsKg: string | number | null;
	consoKwh: string | number | null;
	energyCount: number | string;
	dju: string | number | null;
	nbCycle: string | number | null;
}

export interface HistorySeason {
	id: number;
	name: string;
	startDate: string;
	endDate: string;
}

export interface HistoryIndicators {
	sampleCount: number;
	conso: number | null;
	energy: number | null;
	energyPartial: boolean;
	ecs: number | null;
	max: number | null;
	mean: number | null;
	min: number | null;
	dju: number | null;
	cycles: number | null;
}

export interface MonthlyHistory {
	indicators: HistoryIndicators;
	chart: {
		max: (number | null)[];
		min: (number | null)[];
		consumption: (number | null)[];
		energy: (number | null)[];
		dju: (number | null)[];
		cycles: (number | null)[];
	};
}

export interface SeasonMonth {
	year: number;
	month: number;
	sampleCount: number;
	max: number | null;
	min: number | null;
	consumption: number | null;
	energy: number | null;
	energyPartial: boolean;
	ecs: number | null;
	dju: number | null;
	cycles: number | null;
	efficiency: number | null;
}

export interface SeasonHistory {
	season: HistorySeason;
	indicators: HistoryIndicators;
	months: SeasonMonth[];
}

function numericValue(value: string | number | null): number | null {
	if (value === null) return null;
	const number = Number(value);
	if (!Number.isFinite(number)) throw new Error(getMessages().invalidIndicator);
	return number;
}

function partialEnergy(energy: number | null, count: number | string, start: string, end: string, today?: string): boolean {
	if (energy === null) return false;
	if (!today) return true;
	const last = end < today ? end : new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
	const expected = last < start ? 0
		: Math.floor((Date.parse(`${last}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1;
	const actual = Number(count);
	if (!Number.isSafeInteger(actual) || actual < 0) throw new Error(getMessages().invalidIndicator);
	return actual < expected;
}

function indicators(row: TotalRow, start: string, end: string, today?: string): HistoryIndicators {
	const max = numericValue(row.tcExtMax);
	const min = numericValue(row.tcExtMin);
	const energy = numericValue(row.consoKwh);
	const sampleCount = Number(row.sampleCount);
	if (!Number.isSafeInteger(sampleCount) || sampleCount < 0) throw new Error(getMessages().invalidIndicator);
	return {
		sampleCount,
		conso: numericValue(row.consoKg),
		energy,
		energyPartial: partialEnergy(energy, row.energyCount, start, end, today),
		ecs: numericValue(row.consoEcsKg),
		max,
		mean: max === null || min === null ? null : Math.round((max + min) * 50) / 100,
		min,
		dju: numericValue(row.dju),
		cycles: numericValue(row.nbCycle)
	};
}

export function createHistoryRepository(db: Pick<Pool, 'execute'>) {
	function energyColumn(enabled: boolean): string {
		return enabled
			? 'CASE WHEN (SELECT dirty FROM oko_energy_state WHERE id = 1) = 0 THEN summary.conso_kwh ELSE NULL END'
			: 'NULL';
	}

	async function getTotals(startDate: string, endDate: string, enabled: boolean, today?: string): Promise<HistoryIndicators> {
		const energy = energyColumn(enabled);
		const [rows] = await db.execute<TotalRow[]>(
			`SELECT COUNT(*) AS sampleCount, MAX(tc_ext_max) AS tcExtMax, MIN(tc_ext_min) AS tcExtMin,
				SUM(conso_kg) AS consoKg, SUM(conso_ecs_kg) AS consoEcsKg,
				SUM(${energy}) AS consoKwh, COUNT(${energy}) AS energyCount,
				SUM(dju) AS dju, SUM(nb_cycle) AS nbCycle
			 FROM oko_resume_day AS summary WHERE jour BETWEEN ? AND ?`,
			[startDate, endDate]
		);
		if (!rows[0]) throw new Error(getMessages().indicatorsNoResult);
		return indicators(rows[0], startDate, endDate, today);
	}

	return {
		async getYears(): Promise<number[]> {
			const [rows] = await db.execute<YearRow[]>(
				'SELECT DISTINCT YEAR(jour) AS year FROM oko_resume_day ORDER BY year DESC'
			);
			return rows.map((row) => {
				const year = Number(row.year);
				if (!Number.isSafeInteger(year)) throw new Error(getMessages().invalidIndicator);
				return year;
			});
		},

		async getSeasons(): Promise<HistorySeason[]> {
			const [rows] = await db.execute<SeasonRow[]>(
				'SELECT id, saison AS name, date_debut AS startDate, date_fin AS endDate FROM oko_saisons ORDER BY date_debut'
			);
			return rows.map((row) => ({
				id: row.id,
				name: row.name,
				startDate: row.startDate,
				endDate: row.endDate
			}));
		},

		/** Uses the date reference table so calendar days without measurements stay visible as chart gaps. */
		async getMonthlyHistory(month: number, year: number, enabled = false, today?: string): Promise<MonthlyHistory> {
			const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
			const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
			const [rows] = await db.execute<MonthlyReadingRow[]>(
				`SELECT DAY(calendar.jour) AS day, summary.tc_ext_max AS tcExtMax, summary.tc_ext_min AS tcExtMin,
					summary.conso_kg AS consoKg, ${energyColumn(enabled)} AS consoKwh, summary.dju, summary.nb_cycle AS nbCycle
				 FROM oko_dateref AS calendar
				 LEFT JOIN oko_resume_day AS summary ON summary.jour = calendar.jour
				 WHERE calendar.jour >= ? AND calendar.jour < DATE_ADD(?, INTERVAL 1 MONTH)
				 ORDER BY calendar.jour`,
				[firstDay, firstDay]
			);
			const chart = {
				max: Array<number | null>(lastDay).fill(null),
				min: Array<number | null>(lastDay).fill(null),
				consumption: Array<number | null>(lastDay).fill(null),
				energy: Array<number | null>(lastDay).fill(null),
				dju: Array<number | null>(lastDay).fill(null),
				cycles: Array<number | null>(lastDay).fill(null)
			};
			for (const row of rows) {
				const day = Number(row.day);
				if (!Number.isSafeInteger(day) || day < 1 || day > lastDay) {
					throw new Error(getMessages().invalidIndicator);
				}
				const values = {
					max: numericValue(row.tcExtMax),
					min: numericValue(row.tcExtMin),
					consumption: numericValue(row.consoKg),
					energy: numericValue(row.consoKwh),
					dju: numericValue(row.dju),
					cycles: numericValue(row.nbCycle)
				};
				const index = day - 1;
				chart.max[index] = values.max;
				chart.min[index] = values.min;
				chart.consumption[index] = values.consumption;
				chart.energy[index] = values.energy;
				chart.dju[index] = values.dju;
				chart.cycles[index] = values.cycles;
			}
			const totals = await getTotals(firstDay, `${year}-${String(month).padStart(2, '0')}-${lastDay}`, enabled, today);
			return { indicators: totals, chart };
		},

		async getSeasonHistory(season: HistorySeason, surface: number | null, enabled = false, today?: string): Promise<SeasonHistory> {
			const energyColumnSql = energyColumn(enabled);
			const [rows] = await db.execute<SeasonReadingRow[]>(
				`SELECT YEAR(calendar.jour) AS year, MONTH(calendar.jour) AS month, COUNT(summary.jour) AS sampleCount,
					MAX(summary.tc_ext_max) AS tcExtMax, MIN(summary.tc_ext_min) AS tcExtMin,
					SUM(summary.conso_kg) AS consoKg, SUM(summary.conso_ecs_kg) AS consoEcsKg,
					SUM(${energyColumnSql}) AS consoKwh, COUNT(${energyColumnSql}) AS energyCount,
					SUM(summary.dju) AS dju, SUM(summary.nb_cycle) AS nbCycle
				 FROM oko_dateref AS calendar
				 LEFT JOIN oko_resume_day AS summary ON summary.jour = calendar.jour
				 WHERE calendar.jour BETWEEN ? AND ?
				 GROUP BY YEAR(calendar.jour), MONTH(calendar.jour)
				 ORDER BY YEAR(calendar.jour), MONTH(calendar.jour)`,
				[season.startDate, season.endDate]
			);
			const months = rows.map((row) => {
				const dju = numericValue(row.dju);
				const consumption = numericValue(row.consoKg);
				const energy = numericValue(row.consoKwh);
				const first = `${row.year}-${String(row.month).padStart(2, '0')}-01`;
				const last = `${row.year}-${String(row.month).padStart(2, '0')}-${String(new Date(Date.UTC(Number(row.year), Number(row.month), 0)).getUTCDate()).padStart(2, '0')}`;
				const efficiency =
					surface !== null && surface > 0 && dju !== null && dju > 0 && consumption !== null
						? Math.round((consumption * 1000 / dju / surface) * 100) / 100
						: null;
				return {
					year: Number(row.year),
					month: Number(row.month),
					sampleCount: Number(row.sampleCount),
					max: numericValue(row.tcExtMax),
					min: numericValue(row.tcExtMin),
					consumption,
					energy,
					energyPartial: partialEnergy(energy, row.energyCount, first < season.startDate ? season.startDate : first, last > season.endDate ? season.endDate : last, today),
					ecs: numericValue(row.consoEcsKg),
					dju,
					cycles: numericValue(row.nbCycle),
					efficiency
				};
			});
			return {
				season,
				indicators: await getTotals(season.startDate, season.endDate, enabled, today),
				months
			};
		}
	};
}
