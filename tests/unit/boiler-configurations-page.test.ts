import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Page from '../../src/routes/private/realtime/configurations/+page.svelte';
import { BoilerDraft, boilerDraftContext } from '../../src/lib/boiler-draft.svelte';

describe('écran de suivi des configurations', () => {
	it('affiche le formulaire uniquement lorsque des réglages ont été modifiés', () => {
		const draft = new BoilerDraft();
		draft.initialize({ circuit: 1, updatedAt: 1, readings: {
			comfortTemperature: { value: 20, unit: '°C' }
		} });
		draft.set('hk0_raumtemp_heizen', '21 °C');
		const options = {
			context: new Map([[boilerDraftContext, draft]]),
			props: {
				params: {}, form: null,
				data: {
					member: null, pathname: '/private/realtime/configurations' as const, language: 'fr' as const,
					configurations: [{ timestamp: 1451759470, description: 'Réglage confort' }],
					databaseError: false, indicators: null, realtimeError: null
				}
			}
		};
		const pending = render(Page, options).body;
		expect(pending).toContain('id="configuration-description"');
		expect(pending).toContain('Enregistrer et appliquer');
		expect(pending).toContain('Réglage confort');
		expect(pending).toContain('Des modifications attendent leur enregistrement');

		draft.applied();
		const applied = render(Page, options).body;
		expect(applied).not.toContain('id="configuration-description"');
		expect(applied).not.toContain('Enregistrer et appliquer');
	});

	it('affiche la liste même si la chaudière est indisponible, sans prétendre pouvoir enregistrer', () => {
		const { body } = render(Page, { props: {
			params: {}, form: null,
			data: {
				member: { id: 1, name: 'admin', type: 'admin' },
				pathname: '/private/realtime/configurations',
				language: 'fr',
				configurations: [{ timestamp: 1451759470, description: 'Réglage initial' }],
				databaseError: false, indicators: null, realtimeError: 'connection'
			}
		} });
		expect(body).toContain('Réglage initial');
		expect(body).toContain('Chaudière indisponible');
		expect(body).not.toContain('datetime-local');
		expect(body).toContain('reports-table seasons-table configuration-table');
		expect(body).toContain('aria-label="Afficher : Réglage initial');
		expect(body).toContain('aria-label="Charger dans les réglages : Réglage initial');
		expect(body).toContain('aria-label="Supprimer : Réglage initial');
		expect(body.match(/<svg aria-hidden="true"/g)).toHaveLength(3);
		expect(body).not.toContain('Enregistrer et appliquer');
		expect(body).toContain('disabled');
		expect(body).not.toContain('Configuration appliquée et vérifiée');
	});

	it('signale une base inaccessible plutôt que présenter une liste vide', () => {
		const { body } = render(Page, { props: {
			params: {}, form: null,
			data: {
				member: null, pathname: '/private/realtime/configurations', language: 'fr',
				configurations: [], databaseError: true, indicators: null, realtimeError: 'connection'
			}
		} });
		expect(body).toContain('Impossible de charger les configurations enregistrées.');
		expect(body).not.toContain('Aucune configuration enregistrée.');
	});
});
