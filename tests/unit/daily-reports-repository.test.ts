import { describe, expect, it, vi } from 'vitest';
import type { Pool } from 'mysql2/promise';
import {
	createDailyReportsRepository,
	DailyReportError
} from '../../src/lib/server/repositories/daily-reports';

function repository() {
	const execute = vi.fn();
	const db = { execute } as Pick<Pool, 'execute'>;
	return { execute, reports: createDailyReportsRepository(db) };
}

describe('gestion des graphiques journaliers', () => {
	it('ajoute un graphique avec un nom normalisé et une position en fin de liste', async () => {
		const { execute, reports } = repository();
		execute
			.mockResolvedValueOnce([[]])
			.mockResolvedValueOnce([[{ nextPosition: 3 }]])
			.mockResolvedValueOnce([{ insertId: 7 }]);

		await expect(reports.createGraph('  Chauffage  ')).resolves.toBe(7);
		expect(execute.mock.calls[0][1]).toEqual(['Chauffage']);
		expect(execute.mock.calls[1][0]).toContain('MAX(position)');
		expect(execute.mock.calls[2][1]).toEqual(['Chauffage', 3]);
	});

	it('refuse les doublons avant toute insertion', async () => {
		const { execute, reports } = repository();
		execute.mockResolvedValueOnce([[{ id: 2, name: 'Chauffage', position: 1 }]]);

		await expect(reports.createGraph('Chauffage')).rejects.toMatchObject({
			code: 'duplicate-graph'
		});
		expect(execute).toHaveBeenCalledOnce();
	});

	it('réordonne les graphiques dans une mise à jour CASE paramétrée', async () => {
		const { execute, reports } = repository();
		execute.mockResolvedValueOnce([[
			{ id: 1, name: 'Températures', position: 1 },
			{ id: 2, name: 'Chauffage', position: 2 }
		]]).mockResolvedValueOnce([{ affectedRows: 2 }]);

		await reports.moveGraph(1, 'down');

		expect(execute.mock.calls[1][0]).toContain('CASE id WHEN ? THEN ? WHEN ? THEN ?');
		expect(execute.mock.calls[1][1]).toEqual([2, 1, 1, 2, 2, 1]);
	});

	it('déplace un graphique avant ou après une ligne cible', async () => {
		const { execute, reports } = repository();
		execute
			.mockResolvedValueOnce([[
				{ id: 1, name: 'Températures', position: 1 },
				{ id: 2, name: 'Chauffage', position: 2 },
				{ id: 3, name: 'Hydraulique', position: 3 }
			]])
			.mockResolvedValueOnce([{ affectedRows: 3 }]);

		await reports.reorderGraph(1, 3, 'after');

		expect(execute.mock.calls[1][1]).toEqual([2, 1, 3, 2, 1, 3, 2, 3, 1]);
	});

	it('accepte les coefficients décimaux français et conserve les paramètres SQL', async () => {
		const { execute, reports } = repository();
		execute
			.mockResolvedValueOnce([[{ id: 3, name: 'Températures', position: 1 }]])
			.mockResolvedValueOnce([[{ id: 4, name: 'T° extérieure' }]])
			.mockResolvedValueOnce([[]])
			.mockResolvedValueOnce([[{ nextPosition: 2 }]])
			.mockResolvedValueOnce([{ affectedRows: 1 }]);

		await reports.addAssociation(3, 4, '0,25');

		expect(execute.mock.calls[4][0]).toContain('INSERT INTO oko_asso_capteur_graphe');
		expect(execute.mock.calls[4][1]).toEqual([3, 4, 2, '0.25']);
	});

	it('rejette un coefficient invalide avant tout accès à la base', async () => {
		const { execute, reports } = repository();

		await expect(reports.addAssociation(1, 2, '0,2,5')).rejects.toBeInstanceOf(DailyReportError);
		expect(execute).not.toHaveBeenCalled();
	});

	it('réordonne les capteurs uniquement dans le graphique demandé', async () => {
		const { execute, reports } = repository();
		execute
			.mockResolvedValueOnce([[
				{ sensorId: 3, name: 'Extérieure', position: 1, correctionEffect: '1' },
				{ sensorId: 4, name: 'Départ', position: 2, correctionEffect: '1' },
				{ sensorId: 5, name: 'Ambiante', position: 3, correctionEffect: '1' }
			]])
			.mockResolvedValueOnce([{ affectedRows: 3 }]);

		await reports.reorderAssociation(7, 5, 3, 'before');

		expect(execute.mock.calls[1][1]).toEqual([5, 1, 3, 2, 4, 3, 5, 3, 4, 7]);
	});

	it('supprime aussi les associations du graphique et compacte les positions restantes', async () => {
		const { execute, reports } = repository();
		execute
			.mockResolvedValueOnce([{ affectedRows: 3 }])
			.mockResolvedValueOnce([[
				{ id: 8, name: 'Hydraulique', position: 2 },
				{ id: 9, name: 'Températures', position: 3 }
			]])
			.mockResolvedValueOnce([{ affectedRows: 2 }]);

		await reports.deleteGraph(7);

		expect(execute.mock.calls[0][0]).toContain('DELETE graph, association');
		expect(execute.mock.calls[0][1]).toEqual([7]);
		expect(execute.mock.calls[2][1]).toEqual([8, 1, 9, 2, 8, 9]);
	});
});
