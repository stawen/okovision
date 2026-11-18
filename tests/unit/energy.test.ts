import { describe, expect, it } from 'vitest';
import { calculateEnergySummaries } from '../../src/lib/indicators/energy';

describe('énergie et prix des granulés', () => {
	it('calcule les cumuls et le prix du lot actif, avec des jours manquants signalés', () => {
		const values = calculateEnergySummaries([
			{ day: '2026-01-01', consumption: 9, cycles: 2 },
			{ day: '2026-01-03', consumption: 2, cycles: 3 }
		], [
			{ id: 2, day: '2026-01-04', quantity: 10, price: 4 },
			{ id: 1, day: '2026-01-01', quantity: 10, price: 3 }
		], { pci: 5, efficiency: 90 });
		expect(values).toEqual([
			{ day: '2026-01-01', energy: 40.5, cumulativeKg: 9, cumulativeEnergy: 40.5,
				cumulativeCycles: 2, partial: false, priceKg: 0.3, priceKwh: 0.0667 },
			{ day: '2026-01-03', energy: 9, cumulativeKg: 11, cumulativeEnergy: 49.5,
				cumulativeCycles: 5, partial: true, priceKg: null, priceKwh: null }
		]);
	});

	it('ne suppose pas de paramètres, de prix gratuit ni de stock après épuisement', () => {
		const values = calculateEnergySummaries([
			{ day: '2026-01-01', consumption: 1, cycles: 1 },
			{ day: '2026-01-02', consumption: 2, cycles: 1 }
		], [{ id: 1, day: '2026-01-01', quantity: 2, price: 0 }], null);
		expect(values.map(({ energy, cumulativeEnergy, priceKg, priceKwh }) =>
			[energy, cumulativeEnergy, priceKg, priceKwh]))
			.toEqual([[null, null, null, null], [null, null, null, null]]);
	});

	it('choisit les lots connus à la date et leur ordre pour une journée qui en traverse plusieurs', () => {
		const values = calculateEnergySummaries([
			{ day: '2026-01-01', consumption: 11, cycles: 1 },
			{ day: '2026-01-02', consumption: 1, cycles: 1 }
		], [
			{ id: 2, day: '2026-01-01', quantity: 10, price: 4 },
			{ id: 1, day: '2026-01-01', quantity: 10, price: 3 },
			{ id: 3, day: '2026-01-03', quantity: 10, price: 5 }
		], { pci: 5, efficiency: 90 });
		expect(values.map((row) => row.priceKg)).toEqual([0.4, 0.4]);
	});

	it('refuse les paramètres invalides et les données désordonnées', () => {
		expect(() => calculateEnergySummaries([], [], { pci: 5, efficiency: 0 })).toThrow();
		expect(() => calculateEnergySummaries([
			{ day: '2026-01-01', consumption: Number.MAX_VALUE, cycles: 1 }
		], [], { pci: 5, efficiency: 90 })).toThrow();
		expect(() => calculateEnergySummaries([
			{ day: '2026-01-02', consumption: 1, cycles: 1 },
			{ day: '2026-01-01', consumption: 1, cycles: 1 }
		], [], null)).toThrow();
	});

	it('ne fabrique aucun cumul ni prix lorsque les premières mesures sont inconnues', () => {
		const [result] = calculateEnergySummaries(
			[{ day: '2026-01-01', consumption: null, cycles: null }],
			[{ id: 1, day: '2026-01-01', quantity: 10, price: 3 }],
			{ pci: 5, efficiency: 90 }
		);
		expect(result).toMatchObject({
			energy: null, cumulativeKg: null, cumulativeEnergy: null,
			cumulativeCycles: null, priceKg: null, priceKwh: null, partial: true
		});
	});
});
