import { describe, expect, it } from 'vitest';
import { isValidDay, shiftDay, todayInTimezone } from '../../src/lib/dates';
import { parseInstallationConfig } from '../../src/lib/server/config';

describe('dates de l’installation', () => {
	it('valide les dates calendaires et les années bissextiles', () => {
		expect(isValidDay('2024-02-29')).toBe(true);
		expect(isValidDay('2025-02-29')).toBe(false);
		expect(isValidDay('2026-13-01')).toBe(false);
		expect(isValidDay('2026-1-01')).toBe(false);
	});

	it('respecte le fuseau de l’installation et les changements d’heure', () => {
		expect(todayInTimezone('Europe/Paris', new Date('2026-03-29T22:30:00Z'))).toBe('2026-03-30');
		expect(shiftDay('2026-03-29', 1)).toBe('2026-03-30');
		expect(shiftDay('2024-03-01', -1)).toBe('2024-02-29');
	});
});

describe('configuration historique JSON', () => {
	it('lit le coefficient et le fuseau sans dépendre des autres champs', () => {
		expect(parseInstallationConfig({ poids_pellet: '156', timezone: 'Europe/Paris', lang: 'fr' }))
			.toEqual({ poidsPellet: 156, timezone: 'Europe/Paris', ashtray: null });
		expect(parseInstallationConfig({ poids_pellet: 156, timezone: 'Europe/Paris', ashtray: '1000' }).ashtray)
			.toBe(1000);
	});
	it('refuse un coefficient ou un fuseau invalide', () => {
		expect(() => parseInstallationConfig({ poids_pellet: '', timezone: 'Europe/Paris' })).toThrow('poids_pellet');
		expect(() => parseInstallationConfig({ poids_pellet: 156, timezone: 'invalide' })).toThrow('timezone');
		for (const ashtray of [0, -1, 'invalide', ' ']) {
			expect(() => parseInstallationConfig({ poids_pellet: 156, timezone: 'Europe/Paris', ashtray })).toThrow('ashtray');
		}
	});
});
