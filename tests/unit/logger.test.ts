import { describe, expect, it, vi } from 'vitest';
import { logger } from '../../src/lib/server/logger';

describe('journalisation serveur', () => {
	it('inclut le fichier et la fonction dans une information', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			logger.info({ file: 'scripts/check-db.ts', function: 'main' }, 'databaseCheckSucceeded');
			expect(info).toHaveBeenCalledWith(
				'[scripts/check-db.ts:main] Connexion à la base réussie (SELECT 1).'
			);
		} finally {
			info.mockRestore();
		}
	});

	it('conserve la cause et identifie l’origine d’une erreur', () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		const cause = new Error('test');
		try {
			logger.error(
				{ file: 'src/routes/+page.server.ts', function: 'dashboard' },
				'dailyIndicatorsFailed',
				cause
			);
			expect(error).toHaveBeenCalledWith(
				'[src/routes/+page.server.ts:dashboard] Impossible de charger les indicateurs journaliers.',
				cause
			);
		} finally {
			error.mockRestore();
		}
	});

	it('utilise la langue configurée pour les messages et conserve l’origine', () => {
		const info = vi.spyOn(console, 'info').mockImplementation(() => {});
		try {
			vi.stubEnv('APP_LANG', 'EN');
			logger.info({ file: 'scripts/check-db.ts', function: 'main' }, 'databaseCheckSucceeded');
			expect(info).toHaveBeenLastCalledWith(
				'[scripts/check-db.ts:main] Database connection successful (SELECT 1).'
			);
			vi.stubEnv('APP_LANG', 'FR');
			logger.info({ file: 'scripts/check-db.ts', function: 'main' }, 'databaseCheckSucceeded');
			expect(info).toHaveBeenLastCalledWith(
				'[scripts/check-db.ts:main] Connexion à la base réussie (SELECT 1).'
			);
		} finally {
			vi.unstubAllEnvs();
			info.mockRestore();
		}
	});

	it('signale une langue invalide sans utiliser silencieusement le français', () => {
		try {
			vi.stubEnv('APP_LANG', 'DE');
			expect(() => logger.info({ file: 'test.ts', function: 'test' }, 'databaseCheckSucceeded'))
				.toThrow('APP_LANG');
		} finally {
			vi.unstubAllEnvs();
		}
	});
});
