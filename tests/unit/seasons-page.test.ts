import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Seasons from '../../src/routes/private/administration/seasons/+page.svelte';

const data = {
	member: null,
	pathname: '/private/administration/seasons' as const,
	language: 'fr' as const,
	seasons: [
		{ id: 1, name: '2024-2025', startDate: '2024-09-01', endDate: '2025-08-31' },
		{ id: 2, name: '2025-2026', startDate: '2025-09-01', endDate: '2026-08-31' }
	],
	databaseError: false
};

describe('gestion des saisons', () => {
	it('affiche les saisons, leurs dates et les actions en dialogs', () => {
		const { body, head } = render(Seasons, {
			props: { params: {}, form: null, data }
		});

		expect(head).toContain('Saisons — OkoVision');
		expect(body).toContain('name="operation" value="create-season"');
		expect(body).toContain('name="operation" value="delete-season"');
		expect(body).toContain('id="season-start-date"');
		expect(body).toContain('id="delete-season-dialog-title"');
		expect(body).toContain('<td>2024-2025</td>');
		expect(body).toContain('<td>01/09/2024</td>');
		expect(body).toContain('<td>31/08/2025</td>');
		expect(body).not.toContain('FunctionalScope');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it('garde les en-têtes du tableau visibles sans saisons enregistrées', () => {
		const { body } = render(Seasons, {
			props: { params: {}, form: null, data: { ...data, seasons: [] } }
		});

		expect(body).toContain('<th scope="col">Saison</th>');
		expect(body).toContain('<th scope="col">Date de début</th>');
		expect(body).toContain('Aucune saison n’est définie.');
	});

	it('affiche les erreurs et empêche les écritures si la base est indisponible', () => {
		const { body } = render(Seasons, {
			props: {
				params: {},
				form: { error: 'Impossible d’enregistrer la modification des saisons.' },
				data: {
					member: null,
					pathname: '/private/administration/seasons',
					language: 'fr',
					seasons: [],
					databaseError: true
				}
			}
		});

		expect(body).toContain('role="alert"');
		expect(body).toContain('Impossible d’enregistrer la modification des saisons.');
		expect(body).toContain('Impossible de charger la gestion des saisons.');
		expect(body).toMatch(/class="reports-button reports-button-primary" type="button" disabled/);
	});
});
