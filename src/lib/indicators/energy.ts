import { isValidDay, shiftDay } from '../utils/dates.ts';

export interface EnergyParameters {
	pci: number;
	efficiency: number;
}

export interface EnergySummaryInput {
	day: string;
	consumption: number | null;
	cycles: number | null;
}

export interface PelletDelivery {
	id: number;
	day: string;
	quantity: number;
	price: number;
}

export interface EnergySummary {
	day: string;
	energy: number | null;
	cumulativeKg: number | null;
	cumulativeEnergy: number | null;
	cumulativeCycles: number | null;
	partial: boolean;
	priceKg: number | null;
	priceKwh: number | null;
}

function rounded(value: number, digits: number): number {
	const factor = 10 ** digits;
	const result = Math.round((value + Number.EPSILON) * factor) / factor;
	if (!Number.isFinite(result)) throw new Error('Invalid energy calculation');
	return result;
}

function validNonnegative(value: number | null): boolean {
	return value === null || (Number.isFinite(value) && value >= 0);
}

export function calculateEnergySummaries(
	summaries: readonly EnergySummaryInput[],
	deliveries: readonly PelletDelivery[],
	parameters: EnergyParameters | null
): EnergySummary[] {
	if (parameters !== null && (!Number.isFinite(parameters.pci) || parameters.pci <= 0
		|| !Number.isFinite(parameters.efficiency) || parameters.efficiency <= 0
		|| parameters.efficiency > 100)) {
		throw new Error('Invalid energy parameters');
	}
	const lots = [...deliveries].sort((a, b) => a.day.localeCompare(b.day) || a.id - b.id);
	for (const lot of lots) {
		if (!isValidDay(lot.day) || !Number.isSafeInteger(lot.id) || lot.id <= 0
			|| !Number.isFinite(lot.quantity) || lot.quantity <= 0
			|| !Number.isFinite(lot.price) || lot.price < 0) {
			throw new Error('Invalid pellet delivery');
		}
	}

	let kg = 0;
	let energyTotal = 0;
	let cycles = 0;
	let knownConsumption = false;
	let knownCycles = false;
	let knownEnergy = false;
	let partial = false;
	let previousDay: string | null = null;
	const energyPerKg = parameters === null ? null : parameters.pci * parameters.efficiency / 100;
	if (energyPerKg !== null && (!Number.isFinite(energyPerKg) || energyPerKg <= 0)) {
		throw new Error('Invalid energy per kilogram');
	}
	return summaries.map((summary) => {
		if (!isValidDay(summary.day) || (previousDay !== null && summary.day <= previousDay)
			|| !validNonnegative(summary.consumption) || !validNonnegative(summary.cycles)
			|| (summary.cycles !== null && !Number.isSafeInteger(summary.cycles))) {
			throw new Error('Invalid daily energy summary');
		}
		if (previousDay !== null && shiftDay(previousDay, 1) !== summary.day) partial = true;
		if (summary.consumption === null || summary.cycles === null) partial = true;
		previousDay = summary.day;
		if (summary.consumption !== null) {
			kg = rounded(kg + summary.consumption, 2);
			knownConsumption = true;
		}
		if (summary.cycles !== null) {
			cycles += summary.cycles;
			knownCycles = true;
		}
		if (!Number.isSafeInteger(cycles)) throw new Error('Invalid cumulative cycles');
		const energy = summary.consumption === null || energyPerKg === null
			? null : rounded(summary.consumption * energyPerKg, 2);
		if (energy !== null) {
			energyTotal = rounded(energyTotal + energy, 2);
			knownEnergy = true;
		}

		let supplied = 0;
		let priceKg: number | null = null;
		for (const lot of lots) {
			if (lot.day > summary.day) break;
			supplied += lot.quantity;
			if (knownConsumption && kg <= supplied) {
				priceKg = lot.price > 0 ? rounded(lot.price / lot.quantity, 4) : null;
				break;
			}
		}
		return {
			day: summary.day,
			energy,
			cumulativeKg: knownConsumption ? kg : null,
			cumulativeEnergy: knownEnergy ? energyTotal : null,
			cumulativeCycles: knownCycles ? cycles : null,
			partial,
			priceKg,
			priceKwh: priceKg === null || energyPerKg === null ? null : rounded(priceKg / energyPerKg, 4)
		};
	});
}
