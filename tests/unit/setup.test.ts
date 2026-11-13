import { describe, expect, it, vi } from 'vitest';
import { configurationParameters } from '../../src/lib/configuration';
import { getSetupStatus, parseSetupValues } from '../../src/lib/server/setup';

function form() {
	const values = {
		chaudiere: '192.168.1.23', tcRef: '20', poidsPellet: '150', surfaceMaison: '120',
		timezone: 'Europe/Paris', hasSilo: '0', siloSize: '', ashtray: ''
	};
	const data = new FormData();
	for (const [key, value] of Object.entries(values)) data.set(key, value);
	return data;
}

describe('détection du premier lancement', () => {
	it.each([
		[[], 'install'],
		[['knex_migrations', 'knex_migrations_lock'], 'install'],
		[['oko_resume_day'], 'partial'],
		[['oko_configuration'], 'partial'],
		[['oko_capteur'], 'configure']
	])('détecte %j sans écrire dans la base', async (names, expected) => {
		const execute = vi.fn().mockResolvedValue([names.map((name) => ({ name }))]);
		await expect(getSetupStatus({ execute })).resolves.toBe(expected);
		expect(execute).toHaveBeenCalledOnce();
		expect(execute.mock.calls[0][0]).toMatch(/^SELECT /);
	});

	it.each([null, '', '  ', '0', '-5', 'invalide', 'Infinity', '150'])('vérifie surfaceMaison = %j', async (value) => {
		const execute = vi.fn().mockResolvedValueOnce([[
			{ name: 'oko_capteur' }, { name: 'oko_configuration' }
		]]).mockResolvedValueOnce([[
			{ param: 'surfaceMaison', value },
			{ param: 'chaudiere', value: '192.168.1.23' },
			{ param: 'tcRef', value: '20' }
		]]);
		await expect(getSetupStatus({ execute })).resolves.toBe(value === '150' ? 'ready' : 'configure');
	});

	it('requiert une adresse et une température de référence avant de lancer la collecte', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[
			{ name: 'oko_capteur' }, { name: 'oko_configuration' }
		]]).mockResolvedValueOnce([[
			{ param: 'surfaceMaison', value: '120' }, { param: 'tcRef', value: '20' }
		]]);
		await expect(getSetupStatus({ execute })).resolves.toBe('configure');
	});

	it('ne confond pas une entrée absente ou une panne avec une installation terminée', async () => {
		const execute = vi.fn().mockResolvedValueOnce([[
			{ name: 'oko_capteur' }, { name: 'oko_configuration' }
		]]).mockResolvedValueOnce([[]]);
		await expect(getSetupStatus({ execute })).resolves.toBe('configure');
		execute.mockRejectedValue(new Error('database unavailable'));
		await expect(getSetupStatus({ execute })).rejects.toThrow('database unavailable');
	});
});

describe('valeurs du formulaire', () => {
	it('conserve uniquement les paramètres de configuration actifs', () => {
		const values = parseSetupValues(form());
		expect(Object.keys(values)).toEqual([...configurationParameters]);
		expect(values.surfaceMaison).toBe('120');
	});

	it.each([
		['surfaceMaison', ''], ['poidsPellet', '-1'], ['timezone', 'wrong'],
		['chaudiere', ''], ['tcRef', 'wrong'], ['hasSilo', '1']
	])('refuse %s = %s sans compléter des paramètres manquants', (param, value) => {
		const data = form();
		data.set(param, value);
		expect(() => parseSetupValues(data)).toThrow();
	});

});
