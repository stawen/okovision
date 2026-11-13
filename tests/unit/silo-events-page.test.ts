import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Events from '../../src/routes/private/administration/events/+page.svelte';

describe('gestion des événements de silo', () => {
	it('garde les en-têtes du tableau visibles sans événements enregistrés', () => {
		const { body } = render(Events, {
			props: {
				params: {},
				form: null,
				data: {
					member: null,
					pathname: '/private/administration/events',
					language: 'fr',
					events: [],
					databaseError: false
				}
			}
		});

		expect(body).toContain('<th scope="col">Événement</th>');
		expect(body).toContain('<th scope="col">Date</th>');
		expect(body).toContain('<th scope="col">Détails</th>');
		expect(body).toContain('Aucun événement enregistré.');
	});
});
