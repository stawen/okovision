import { describe, expect, it, vi } from 'vitest';
import { logger } from '../../src/lib/server/logger';

describe('journalisation serveur', () => {
	it('écrit une information structurée avec son composant et son événement', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			logger.child({ component: 'database-check' }).info('databaseCheckSucceeded', {
				durationMs: 12
			});
			const entry = JSON.parse(info.mock.calls[0][0] as string);
			expect(entry).toMatchObject({
				level: 'info',
				component: 'database-check',
				event: 'databaseCheckSucceeded',
				message: 'Connexion à la base réussie (SELECT 1).',
				durationMs: 12
			});
			expect(entry.timestamp).toEqual(expect.any(String));
		} finally {
			info.mockRestore();
		}
	});

	it('écrit la cause structurée et le contexte d’une erreur', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const cause = new Error('test');
		try {
			logger.child({ component: 'dashboard' }).error('dailyIndicatorsFailed', cause, {
				day: '2026-11-11'
			});
			const entry = JSON.parse(error.mock.calls[0][0] as string);
			expect(entry).toMatchObject({
				level: 'error',
				component: 'dashboard',
				event: 'dailyIndicatorsFailed',
				message: 'Impossible de charger les indicateurs journaliers.',
				day: '2026-11-11',
				err: { type: 'Error', message: 'test' }
			});
			expect(entry.err.stack).toContain('Error: test');
		} finally {
			error.mockRestore();
		}
	});

	it('utilise la langue configurée pour les messages', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			vi.stubEnv('APP_LANG', 'EN');
			const log = logger.child({ component: 'database-check' });
			log.info('databaseCheckSucceeded');
			expect(JSON.parse(info.mock.calls[0][0] as string).message).toBe(
				'Database connection successful (SELECT 1).'
			);
			vi.stubEnv('APP_LANG', 'FR');
			log.info('databaseCheckSucceeded');
			expect(JSON.parse(info.mock.calls[1][0] as string).message).toBe(
				'Connexion à la base réussie (SELECT 1).'
			);
		} finally {
			vi.unstubAllEnvs();
			info.mockRestore();
		}
	});

	it('signale une langue invalide sans utiliser silencieusement le français', () => {
		const output = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			vi.stubEnv('APP_LANG', 'DE');
			logger.child({ component: 'test' }).error('databaseCheckFailed', new Error('original'));
			expect(JSON.parse(output.mock.calls[0][0] as string)).toMatchObject({
				level: 'error',
				event: 'databaseCheckFailed',
				message: 'APP_LANG doit être FR ou EN / APP_LANG must be FR or EN.',
				err: { message: 'original' }
			});
		} finally {
			vi.unstubAllEnvs();
			output.mockRestore();
		}
	});
});
