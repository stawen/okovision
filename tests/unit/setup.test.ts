import { describe, expect, it, vi } from 'vitest';
import { configurationParameters } from '../../src/lib/configuration';
import { getSetupStatus, parseSetupValues } from '../../src/lib/server/setup';

function form() {
	const values = {
		chaudiere: '', tcRef: '', poidsPellet: '150', surfaceMaison: '120',
		getDataFromChaudiere: '0', timezone: 'Europe/Paris', sendToWeb: '0',
		hasSilo: '0', siloSize: '', ashtray: '', lang: 'fr'
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
		]]).mockResolvedValueOnce([[{ param: 'surfaceMaison', value }]]);
		await expect(getSetupStatus({ execute })).resolves.toBe(value === '150' ? 'ready' : 'configure');
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
	it('conserve les onze paramètres sans activer implicitement la collecte', () => {
		const values = parseSetupValues(form());
		expect(Object.keys(values)).toEqual([...configurationParameters]);
		expect(values.getDataFromChaudiere).toBe('0');
		expect(values.surfaceMaison).toBe('120');
	});

	it.each([
		['surfaceMaison', ''], ['poidsPellet', '-1'], ['timezone', 'wrong'],
		['getDataFromChaudiere', '1'], ['hasSilo', '1'], ['lang', 'de']
	])('refuse %s = %s sans compléter des paramètres manquants', (param, value) => {
		const data = form();
		data.set(param, value);
		expect(() => parseSetupValues(data)).toThrow();
	});

});
