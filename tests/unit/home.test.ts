import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Home from '../../src/routes/+page.svelte';

const day = {
	day: '2026-11-11',
	today: '2026-11-11',
	previous: '2026-11-10',
	next: null,
	databaseError: false
};

describe('accueil journalier', () => {
	it('affiche les indicateurs réels, y compris zéro, et garde les valeurs nulles indisponibles', () => {
		const { body } = render(Home, {
			props: {
				params: {},
				form: null,
				data: {
					...day,
					indicators: { sampleCount: 2, conso: 12.35, ecs: 0, max: 8.5, min: null, missingSensors: false }
				}
			}
		});
		expect(body).toContain('12,35');
		expect(body).toContain('0,00');
		expect(body).toContain('8,50');
		expect(body.match(/aria-label="Non disponible"/g)).toHaveLength(1);
		expect(body).toContain('value="2026-11-11"');
		expect(body).toContain('method="POST"');
		expect(body).toContain('name="direction"');
		expect(body).not.toContain('?jour=');
		expect(body).toContain('Graphique en cours de migration');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it('affiche la journée retournée par le formulaire sans modifier l’URL', () => {
		const indicators = { sampleCount: 2, conso: 4, ecs: 1, max: 8, min: 2, missingSensors: false };
		const { body } = render(Home, {
			props: {
				params: {},
				data: { ...day, indicators },
				form: { ...day, day: '2026-11-10', previous: '2026-11-09', next: '2026-11-11', indicators }
			}
		});
		expect(body).toContain('value="2026-11-10"');
		expect(body).toContain('4,00');
		expect(body).not.toContain('?jour=');
	});

	it('signale une erreur de base sans afficher de mesures simulées', () => {
		const { body } = render(Home, {
			props: { params: {}, form: null, data: { ...day, indicators: null, databaseError: true } }
		});
		expect(body.match(/aria-label="Non disponible"/g)).toHaveLength(4);
		expect(body).toContain('Impossible de charger les indicateurs.');
		expect(body).not.toContain('0,00');
		expect(body).toContain('id="migration"');
	});

	it('distingue une journée sans relevés', () => {
		const { body } = render(Home, {
			props: {
				params: {},
				form: null,
				data: {
					...day,
					indicators: { sampleCount: 0, conso: null, ecs: null, max: null, min: null, missingSensors: false }
				}
			}
		});
		expect(body).toContain('Aucun relevé pour cette journée.');
	});
});
