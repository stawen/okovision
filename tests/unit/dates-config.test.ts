import { describe, expect, it } from 'vitest';
import { isValidDay, shiftDay, todayInTimezone } from '../../src/lib/dates';
import { parseBoilerAddress, parseHistorySettings, parseInstallationConfig } from '../../src/lib/server/config';

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

describe('configuration JSON', () => {
	it('lit le coefficient et le fuseau sans dépendre des autres champs', () => {
		expect(parseInstallationConfig({ poidsPellet: '156', timezone: 'Europe/Paris', lang: 'fr' }))
			.toEqual({ poidsPellet: 156, timezone: 'Europe/Paris', ashtray: null });
		expect(parseInstallationConfig({ poidsPellet: 156, timezone: 'Europe/Paris', ashtray: '1000' }).ashtray)
			.toBe(1000);
		expect(parseHistorySettings({
			surfaceMaison: '150', hasSilo: '1', siloSize: '4000'
		})).toMatchObject({ surfaceMaison: 150, hasSilo: true, siloSize: 4000 });
		expect(parseHistorySettings({ surfaceMaison: '0', hasSilo: '0', siloSize: 0 }))
			.toEqual({ surfaceMaison: null, hasSilo: false, siloSize: null });
		expect(parseInstallationConfig({
			poidsPellet: 156, timezone: 'Europe/Paris', surfaceMaison: -1
		})).toMatchObject({ poidsPellet: 156 });
	});
	it('refuse un coefficient ou un fuseau invalide', () => {
		expect(() => parseInstallationConfig({ poidsPellet: '', timezone: 'Europe/Paris' })).toThrow('poidsPellet');
		expect(() => parseInstallationConfig({ poidsPellet: 156, timezone: 'invalide' })).toThrow('timezone');
		for (const ashtray of [0, -1, 'invalide', ' ']) {
			expect(() => parseInstallationConfig({ poidsPellet: 156, timezone: 'Europe/Paris', ashtray })).toThrow('ashtray');
		}
		expect(() => parseHistorySettings({ surfaceMaison: -1 })).toThrow('surfaceMaison');
		expect(() => parseHistorySettings({ hasSilo: 'bad' })).toThrow('hasSilo');
	});

	it('refuse explicitement les anciennes clés, même en présence des nouvelles', () => {
		expect(() => parseInstallationConfig({
			poidsPellet: 156, poids_pellet: 100, timezone: 'Europe/Paris'
		})).toThrow('poids_pellet');
		expect(() => parseHistorySettings({ hasSilo: true, has_silo: 0 })).toThrow('has_silo');
		expect(() => parseInstallationConfig({
			poidsPellet: 156, timezone: 'Europe/Paris', send_to_web: '0'
		})).toThrow('send_to_web');
	});

	it('valide l’adresse de chaudière historique sans imposer sa présence aux autres pages', () => {
		expect(parseBoilerAddress({ chaudiere: '192.168.1.23' })).toBe('http://192.168.1.23');
		expect(parseBoilerAddress({ chaudiere: 'chaudiere.local:8180' })).toBe('http://chaudiere.local:8180');
		expect(() => parseBoilerAddress({})).toThrow('chaudiere');
		expect(() => parseBoilerAddress({ chaudiere: 'http://example.test/path' })).toThrow('chaudiere');
		expect(() => parseBoilerAddress({ chaudiere: 'example.test:99999' })).toThrow('chaudiere');
	});
});
