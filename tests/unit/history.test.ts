import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import History from '../../src/routes/history/+page.svelte';

describe('historique', () => {
	it('reprend les synthèses legacy sans afficher de mesures simulées', () => {
		const { body, head } = render(History, {
			props: { params: {}, data: { language: 'fr', member: null, pathname: '/history' } }
		});

		expect(head).toContain('Historique — OkoVision');
		expect(body).toContain('Synthèse mensuelle');
		expect(body).toContain('Synthèse de saison');
		expect(body).toContain('Stock de pellets');
		expect(body).toContain('Récapitulatif de la saison');
		expect(body).toContain('T° max ext.');
		expect(body).toContain('Cycles brûleur');
		expect(body).toContain('Dont ECS (kg)');
		expect(body).toContain('Dont ECS');
		expect(body).toContain('Granulés');
		expect(body).toContain('Températures extérieures');
		expect(body).toContain('Journée');
		expect(body).not.toContain('metric-dot');
		expect(body).toContain('Le graphique sera alimenté lorsque les données historiques seront raccordées.');
		expect(body).toContain('Indisponible');
		expect(body).not.toContain('0,00');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it('conserve les séries des deux graphiques et désactive les filtres non raccordés', () => {
		const { body } = render(History, {
			props: { params: {}, data: { language: 'en', member: null, pathname: '/history' } }
		});

		for (const series of [
			'Max. outside temp.',
			'Min. outside temp.',
			'Consumption',
			'Degree days',
			'Burner cycles',
			'Incl. hot water'
		]) {
			expect(body).toContain(series);
		}
		expect(body.match(/<select disabled/g)).toHaveLength(3);
		expect(body).toContain('The chart will be populated when historical data is connected.');
		expect(body).toContain('Pellets');
		expect(body).toContain('Outdoor temperatures');
		expect(body).toContain('Daily');
		expect(body).not.toContain('Synthèse mensuelle');
	});
});
