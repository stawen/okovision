import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	checkDatabaseConnection: vi.fn(),
	spawnSync: vi.fn()
}));

vi.mock('node:child_process', () => ({ spawnSync: mocks.spawnSync }));
vi.mock('../../src/lib/server/database.ts', () => ({
	checkDatabaseConnection: mocks.checkDatabaseConnection
}));

import { prepareDevelopmentDatabase } from '../../scripts/dev-local.ts';

describe('préparation des bases de développement', () => {
	beforeEach(() => {
		mocks.checkDatabaseConnection.mockReset().mockResolvedValue(undefined);
		mocks.spawnSync.mockReset().mockReturnValue({ status: 0 });
	});

	it.each([
		['local', 'DEV_DB_PORT', '3307'],
		['setup', 'DEV_SETUP_DB_PORT', '3309'],
		['v1', 'DEV_V1_DB_PORT', '3311']
	])('isole le mode %s sur son port local', async (mode, portName, defaultPort) => {
		const env: NodeJS.ProcessEnv = {
			DB_ADRESSE: 'production.example:3306',
			DB_NAME: 'autre',
			DB_USER: 'autre'
		};
		await prepareDevelopmentDatabase(mode, env);
		expect(env).toMatchObject({
			DB_ADRESSE: `127.0.0.1:${defaultPort}`,
			DB_NAME: 'okovision',
			DB_USER: 'okovision'
		});
		expect(mocks.checkDatabaseConnection).toHaveBeenCalledWith(env);
		expect(mocks.spawnSync).toHaveBeenCalledTimes(mode === 'local' ? 1 : 0);

		env[portName] = '4321';
		await prepareDevelopmentDatabase(mode, env);
		expect(env.DB_ADRESSE).toBe('127.0.0.1:4321');
	});

	it('applique les migrations V2 et arrête le lancement en cas d’échec', async () => {
		const env = {};
		mocks.spawnSync.mockReturnValue({ status: 1 });
		await expect(prepareDevelopmentDatabase('local', env)).rejects.toThrow('Échec des migrations');
		expect(mocks.spawnSync).toHaveBeenCalledWith(
			process.execPath,
			expect.arrayContaining(['migrate:latest']),
			{ stdio: 'inherit', env }
		);
	});

	it('arrête le lancement si la connexion à la base échoue', async () => {
		mocks.checkDatabaseConnection.mockRejectedValue(new Error('Connexion impossible'));
		await expect(prepareDevelopmentDatabase('local', {})).rejects.toThrow('Connexion impossible');
		expect(mocks.spawnSync).not.toHaveBeenCalled();
	});

	it('refuse un mode ou un port invalide avant toute connexion', async () => {
		await expect(prepareDevelopmentDatabase('toString', {})).rejects.toThrow('Mode de développement invalide');
		await expect(prepareDevelopmentDatabase('setup', { DEV_SETUP_DB_PORT: '65536' })).rejects.toThrow('DEV_SETUP_DB_PORT');
		expect(mocks.checkDatabaseConnection).not.toHaveBeenCalled();
		expect(mocks.spawnSync).not.toHaveBeenCalled();
	});
});
