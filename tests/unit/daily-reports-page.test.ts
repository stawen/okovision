import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Reports from '../../src/routes/private/configuration/reports/+page.svelte';

const data = {
	member: null,
	pathname: '/private/configuration/reports' as const,
	language: 'fr' as const,
	graphs: [
		{ id: 1, name: 'Températures', position: 1 },
		{ id: 2, name: 'Chauffage', position: 2 }
	],
	sensors: [
		{ id: 3, name: 'T° extérieure' },
		{ id: 4, name: 'T° départ' }
	],
	associations: [
		{ sensorId: 3, name: 'T° extérieure', position: 1, correctionEffect: '1' }
	],
	selectedGraphId: 1,
	databaseError: false
};

describe('gestion des rapports journaliers', () => {
	it('affiche les graphiques, les affectations et les actions métier', () => {
		const { body, head } = render(Reports, {
			props: { params: {}, form: null, data }
		});

		expect(head).toContain('Gestion des rapports journaliers — OkoVision');
		expect(body).toContain('name="operation" value="create-graph"');
		expect(body).toContain('aria-label="Modifier: Températures"');
		expect(body).toContain('aria-label="Supprimer: Températures"');
		expect(body).toContain('name="operation" value="move-graph"');
		expect(body).toContain('name="operation" value="reorder-graph"');
		expect(body).toContain('name="operation" value="add-association"');
		expect(body).toContain('name="operation" value="delete-association"');
		expect(body).toContain('name="operation" value="reorder-association"');
		expect(body).toContain('draggable="true"');
		expect(body).toContain('name="operation" value="select-graph"');
		expect(body).not.toContain('>Afficher</button>');
		expect(body).toContain('id="graph-dialog-name"');
		expect(body).toContain('id="association-dialog"');
		expect(body).toContain('id="association-coefficient"');
		expect(body).toContain('id="delete-association-dialog"');
		expect(body).toContain('aria-label="Modifier: T° extérieure"');
		expect(body).toContain('id="delete-graph-dialog"');
		expect(body).toContain('id="delete-graph-dialog-title"');
		expect(body).toContain('name="operation" value="delete-graph"');
		expect(body).not.toContain('class="reports-inline-form"');
		expect(body).not.toContain('class="reports-add-form reports-association-form"');
		expect(body).not.toContain('id="graph-name-1"');
		expect(body).toContain('<td>Températures</td>');
		expect(body).toContain('T° extérieure');
		expect(body).toContain('T° départ');
		expect(body).not.toContain('method="GET"');
		expect(body).not.toContain('name="graph"');
		expect(body).not.toMatch(/(?:href|action)="[^"]*\?/);
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it('conserve les erreurs visibles et désactive les écritures si la base est indisponible', () => {
		const { body } = render(Reports, {
			props: {
				params: {},
				form: { error: 'Impossible d’enregistrer la modification des rapports journaliers.' },
				data: {
					member: null,
					pathname: '/private/configuration/reports',
					language: 'fr',
					databaseError: true,
					graphs: [],
					sensors: [],
					associations: [],
					selectedGraphId: null
				}
			}
		});

		expect(body).toContain('role="alert"');
		expect(body).toContain('Impossible d’enregistrer la modification des rapports journaliers.');
		expect(body).toContain('Impossible de charger la gestion des rapports journaliers.');
		expect(body).toMatch(/class="reports-button reports-button-primary" type="submit" disabled/);
	});
});
