import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { calculateEnergySummaries, type EnergyParameters, type EnergySummary } from '../../indicators/energy.ts';

type Database = Pick<Pool, 'execute'>;

interface StateRow extends RowDataPacket {
	dirty: number;
}

interface TableRow extends RowDataPacket {
	count: number;
}

interface SummaryRow extends RowDataPacket {
	day: string;
	consumption: number | string | null;
	cycles: number | string | null;
}

interface DeliveryRow extends RowDataPacket {
	id: number;
	day: string;
	quantity: number | string;
	price: number | string;
}

interface ConfigRow extends RowDataPacket {
	param: string;
	value: string | null;
}

function numberOrNull(value: number | string | null): number | null {
	if (value === null) return null;
	const number = Number(value);
	if (!Number.isFinite(number)) throw new Error('Invalid energy source data');
	return number;
}

export function createEnergyRepository(db: Database) {
	async function status(): Promise<'unavailable' | 'dirty' | 'ready'> {
		const [tables] = await db.execute<TableRow[]>(
			"SELECT COUNT(*) AS count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'oko_energy_state'"
		);
		if (Number(tables[0]?.count) === 0) return 'unavailable';
		if (Number(tables[0]?.count) !== 1) throw new Error('Invalid energy state table');
		const [rows] = await db.execute<StateRow[]>('SELECT dirty FROM oko_energy_state WHERE id = 1');
		if (rows.length !== 1 || ![0, 1].includes(Number(rows[0].dirty))) throw new Error('Invalid energy state');
		return Number(rows[0].dirty) === 0 ? 'ready' : 'dirty';
	}

	async function mark(dirty: boolean): Promise<void> {
		const [result] = await db.execute<ResultSetHeader>(
			'UPDATE oko_energy_state SET dirty = ? WHERE id = 1', [dirty ? 1 : 0]
		);
		if (result.affectedRows !== 1) throw new Error('Missing energy state');
	}

	async function calculate(): Promise<{ summaries: EnergySummary[]; parameters: EnergyParameters | null }> {
		const [config] = await db.execute<ConfigRow[]>(
			"SELECT param, value FROM oko_configuration WHERE param IN ('pciPellet', 'rendementChaudiere')"
		);
		const values = Object.fromEntries(config.map((row) => [row.param, row.value]));
		const pci = values.pciPellet;
		const efficiency = values.rendementChaudiere;
		const noPci = pci == null || pci.trim() === '';
		const noEfficiency = efficiency == null || efficiency.trim() === '';
		if (noPci !== noEfficiency) throw new Error('Incomplete energy parameters');
		const parameters = noPci || noEfficiency ? null : { pci: Number(pci), efficiency: Number(efficiency) };
		const [summaries] = await db.execute<SummaryRow[]>(
			`SELECT DATE_FORMAT(jour, '%Y-%m-%d') AS day, conso_kg AS consumption, nb_cycle AS cycles
			 FROM oko_resume_day ORDER BY jour`
		);
		const [deliveries] = await db.execute<DeliveryRow[]>(
			`SELECT id, DATE_FORMAT(event_date, '%Y-%m-%d') AS day, quantity, price
			 FROM oko_silo_events WHERE event_type IN ('PELLET', 'BAG') ORDER BY event_date, id`
		);
		const calculated = calculateEnergySummaries(
			summaries.map((row) => ({
				day: row.day, consumption: numberOrNull(row.consumption), cycles: numberOrNull(row.cycles)
			})),
			deliveries.map((row) => ({
				id: Number(row.id), day: row.day, quantity: Number(row.quantity), price: Number(row.price)
			})),
			parameters
		);
		return { summaries: calculated, parameters };
	}

	async function rebuild(signal: AbortSignal): Promise<{ summaries: EnergySummary[]; parameters: EnergyParameters | null }> {
		await mark(true);
		const result = await calculate();
		const { summaries } = result;
		for (const row of summaries) {
			signal.throwIfAborted();
			await db.execute(
				`UPDATE oko_resume_day SET conso_kwh = ?, cumul_kg = ?, cumul_kwh = ?,
				 cumul_cycle = ?, prix_kg = ?, prix_kwh = ?, cumul_partiel = ? WHERE jour = ?`,
				[row.energy, row.cumulativeKg, row.cumulativeEnergy, row.cumulativeCycles,
					row.priceKg, row.priceKwh, row.partial ? 1 : 0, row.day]
			);
		}
		signal.throwIfAborted();
		await mark(false);
		return result;
	}

	return {
		status,
		calculate,
		rebuild,
		async mutate<T>(
			signal: AbortSignal,
			mutation: () => Promise<T>,
			unchangedError: (cause: unknown) => boolean = () => false
		): Promise<T> {
			const previous = await status();
			if (previous === 'unavailable') return mutation();
			await mark(true);
			let result: T;
			try {
				result = await mutation();
			} catch (cause) {
				if (previous === 'ready' && unchangedError(cause)) await mark(false);
				throw cause;
			}
			if (previous === 'ready') await rebuild(signal);
			return result;
		}
	};
}
