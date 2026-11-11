import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { createConnection, createPool, query, end } = vi.hoisted(() => ({
	createConnection: vi.fn(),
	createPool: vi.fn(),
	query: vi.fn(),
	end: vi.fn()
}));

vi.mock('mysql2/promise', () => ({ createConnection, createPool }));

import { checkDatabaseConnection, databaseOptions } from '../../src/lib/server/database';

const env = {
	DB_ADRESSE: 'db.example.com:3307',
	DB_NAME: 'okovision',
	DB_USER: 'reader',
	DB_PASSWORD: 'test-password'
};

describe('configuration de la base', () => {
	it('utilise le port fourni et vérifie le certificat et le nom du serveur par défaut', () => {
		expect(databaseOptions(env)).toMatchObject({
			host: 'db.example.com',
			port: 3307,
			ssl: { rejectUnauthorized: true, verifyIdentity: true }
		});
		expect(databaseOptions({ ...env, DB_ADRESSE: 'db.example.com' }).port).toBe(3306);
	});

	it('ne désactive TLS que sur demande explicite', () => {
		expect(databaseOptions({ ...env, DB_TLS_MODE: 'disabled' }).ssl).toBeUndefined();
		expect(() => databaseOptions({ ...env, DB_TLS_MODE: 'invalid' })).toThrow('DB_TLS_MODE');
		expect(() =>
			databaseOptions({ ...env, DB_TLS_MODE: 'disabled', DB_TLS_CA_FILE: '/ca.pem' })
		).toThrow('DB_TLS_CA_FILE');
	});

	it('refuse les adresses incorrectes et les secrets ambigus ou absents', () => {
		for (const address of ['db.example.com:0', 'db.example.com:99999', 'mysql://db', 'db/path']) {
			expect(() => databaseOptions({ ...env, DB_ADRESSE: address })).toThrow('DB_ADRESSE');
		}
		expect(() => databaseOptions({ ...env, DB_PASSWORD: '' })).toThrow('DB_PASSWORD');
		expect(() => databaseOptions({ ...env, DB_PASSWORD_FILE: '/secret' })).toThrow('pas les deux');
	});

	it('lit le mot de passe depuis un fichier privé sans conserver le saut de ligne final', () => {
		const directory = mkdtempSync(join(tmpdir(), 'okovision-db-test-'));
		const path = join(directory, 'password');
		try {
			writeFileSync(path, 'secret avec espaces \n');
			expect(databaseOptions({ ...env, DB_PASSWORD: '', DB_PASSWORD_FILE: path }).password).toBe(
				'secret avec espaces '
			);
		} finally {
			rmSync(path, { force: true });
			rmdirSync(directory);
		}
	});
});

describe('contrôle de connexion', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		createConnection.mockResolvedValue({ query, end });
		query.mockResolvedValue([]);
		end.mockResolvedValue(undefined);
	});

	describe('environnement de connexion du serveur', () => {
		it('ne masque pas une erreur de lecture du fichier .env', async () => {
			vi.resetModules();
			const { getDatabasePool } = await import('../../src/lib/server/database');
			const load = vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {
				throw new Error('fichier illisible');
			});
			try {
				expect(() => getDatabasePool()).toThrow('fichier illisible');
			} finally {
				load.mockRestore();
			}
		});

		it('charge .env avant la création du pool, même avec un lancement direct de Vite', async () => {
			vi.resetModules();
			const { getDatabasePool } = await import('../../src/lib/server/database');
			const load = vi.spyOn(process, 'loadEnvFile').mockImplementation(() => {
				for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
			});
			createPool.mockReturnValue({});
			try {
				getDatabasePool();
				expect(load).toHaveBeenCalledWith('.env');
				expect(createPool).toHaveBeenCalledWith(expect.objectContaining({ host: 'db.example.com', port: 3307 }));
			} finally {
				load.mockRestore();
				vi.unstubAllEnvs();
			}
		});
	});

	it('exécute uniquement SELECT 1 et ferme la connexion', async () => {
		await checkDatabaseConnection(env);
		expect(query).toHaveBeenCalledExactlyOnceWith('SELECT 1');
		expect(end).toHaveBeenCalledOnce();
	});

	it('propage les erreurs de requête et ferme la connexion', async () => {
		query.mockRejectedValue(new Error('requête impossible'));
		await expect(checkDatabaseConnection(env)).rejects.toThrow('requête impossible');
		expect(end).toHaveBeenCalledOnce();
	});
});
