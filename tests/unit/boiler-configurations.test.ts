import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import { editableRealtimeIndicators, legacySensorId } from '../../src/lib/indicators/realtime';
import { createBoilerConfigurationsRepository, currentLegacyTimestamp, legacyWallTimestamp } from '../../src/lib/server/repositories/boiler-configurations';
import { BoilerDraft } from '../../src/lib/boiler-draft.svelte';
import { stepBoilerValue } from '../../src/lib/boiler-configurations';

function repository() {
	const execute = vi.fn();
	return { execute, configurations: createBoilerConfigurationsRepository({ execute } as Pick<Pool, 'execute'>) };
}

describe('configurations chaudière historiques', () => {
	it('ajuste les valeurs selon le pas historique, la précision chaudière et les limites', () => {
		const decimal = { min: 5, max: 40, divisor: 10 };
		expect(stepBoilerValue('21,1', decimal, 1)).toBe('21.2');
		expect(stepBoilerValue('21.1', decimal, -1)).toBe('21');
		expect(stepBoilerValue('40', decimal, 1)).toBe('40');
		expect(stepBoilerValue('5', decimal, -1)).toBe('5');
		expect(stepBoilerValue('21', { ...decimal, divisor: 1 }, 1)).toBe('22');
		expect(stepBoilerValue('21', { ...decimal, divisor: 100 }, 1)).toBe('21.1');
		expect(stepBoilerValue('21', { ...decimal, divisor: 2 }, -1)).toBe('20.5');
		expect(stepBoilerValue('', decimal, 1)).toBeNull();
		expect(stepBoilerValue('21.05', decimal, 1)).toBeNull();
		expect(stepBoilerValue('41', decimal, -1)).toBeNull();
	});

	it('lit le format JSON historique sans convertir les identifiants ni les unités', async () => {
		const { execute, configurations } = repository();
		execute.mockResolvedValueOnce([[{ config: '{"hk0_raumtemp_heizen":"20.5 °C","FA0_pe_abschalttemperatur":"76 °C"}' }]]);
		await expect(configurations.get(1451759470)).resolves.toEqual({
			hk0_raumtemp_heizen: '20.5 °C', FA0_pe_abschalttemperatur: '76 °C'
		});
		expect(execute.mock.calls[0][1]).toEqual([1451759470]);
	});

	it('enregistre un instantané complet en paramètres SQL et rejette un instantané incomplet', async () => {
		const { execute, configurations } = repository();
		const config = Object.fromEntries(editableRealtimeIndicators.map((indicator) => [legacySensorId(indicator), '20 °C']));
		execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
		await configurations.save(1451759470, ' essai ', config);
		expect(execute.mock.calls[0][1]).toEqual([1451759470, 'essai', JSON.stringify(config)]);
		await expect(configurations.save(1451759471, 'essai', { hk0_raumtemp_heizen: '20 °C' }))
			.rejects.toMatchObject({ code: 'invalid' });
		expect(execute).toHaveBeenCalledTimes(1);
	});

	it('signale un doublon de date et une suppression inexistante', async () => {
		const { execute, configurations } = repository();
		const config = Object.fromEntries(editableRealtimeIndicators.map((indicator) => [legacySensorId(indicator), '20']));
		execute.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }));
		await expect(configurations.save(1451759470, 'essai', config)).rejects.toMatchObject({ code: 'conflict' });
		execute.mockResolvedValueOnce([{ affectedRows: 0 }]);
		await expect(configurations.delete(1451759470)).rejects.toMatchObject({ code: 'not-found' });
	});

	it('conserve la convention historique de date locale et contrôle les dates invalides', () => {
		expect(currentLegacyTimestamp('Europe/Paris', new Date('2026-07-01T10:00:00Z')))
			.toBe(legacyWallTimestamp('2026-07-01T12:00:00'));
		expect(currentLegacyTimestamp('Europe/Paris', new Date('2026-01-01T10:00:00Z')))
			.toBe(legacyWallTimestamp('2026-01-01T11:00:00'));
		expect(() => legacyWallTimestamp('2026-02-30T12:00')).toThrow();
	});

	it('préserve les modifications pendant la navigation et ne fabrique pas de valeur absente', () => {
		const draft = new BoilerDraft();
		draft.initialize({ circuit: 1, updatedAt: 1, readings: {
			comfortTemperature: { value: 20, unit: '°C' }
		} });
		draft.set('hk0_raumtemp_heizen', '21 °C');
		expect(draft.changes).toEqual({ hk0_raumtemp_heizen: 20 });
		draft.load({ hk0_raumtemp_heizen: '22 °C', hk0_raumtemp_absenken: '19 °C' });
		expect(draft.values.hk0_raumtemp_absenken).toBeUndefined();
		expect(draft.partialLoaded).toBe(true);
		expect(draft.complete).toBe(false);
		draft.set('hk0_raumtemp_heizen', '20 °C');
		expect(draft.dirty).toBe(false);
	});
});
