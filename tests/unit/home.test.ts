import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Home from '../../src/routes/+page.svelte';

const day = {
	member: null,
	pathname: '/' as const,
	day: '2026-11-11',
	today: '2026-11-11',
	previous: '2026-11-10',
	next: null,
	databaseError: false,
	chartData: { graphs: [], annotations: [], sampleCount: 0 },
	chartError: false,
	language: 'fr' as const,
	ashtray: 'ok' as const
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
		expect(body).toContain('Aucun graphique n’est configuré');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it('affiche les graphiques et capteurs configurés par le legacy', () => {
		const { body } = render(Home, {
			props: {
				params: {},
				form: null,
				data: {
					...day,
					indicators: null,
					chartData: {
						graphs: [
							{
								id: 1,
								name: 'Températures',
								series: [{ name: 'T° extérieure', data: [[1794355200000, 7.5] as [number, number]] }]
							}
						],
						annotations: [{ timestamp: 1794355200000, description: 'Réglage chauffage' }],
						sampleCount: 1
					}
				}
			}
		});
		expect(body).toContain('Graphiques de la journée');
		expect(body).toContain('Températures');
		expect(body).toContain('Graphique journalier: Températures');
		expect(body).not.toContain('T° ambiante consigne');
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

	it('affiche l’alerte de remplissage sans lien vers le suivi non porté', () => {
		const indicators = { sampleCount: 2, conso: 1, ecs: 0, max: 8, min: 2, missingSensors: false };
		const { body } = render(Home, {
			props: { params: {}, form: null, data: { ...day, indicators, ashtray: 'full' } }
		});
		expect(body).toContain('Votre cendrier est plein.');
		expect(body).toContain('enregistrez ce vidage dans les événements de maintenance.');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it('actualise le suivi après un changement de journée', () => {
		const indicators = { sampleCount: 2, conso: 1, ecs: 0, max: 8, min: 2, missingSensors: false };
		const { body } = render(Home, {
			props: {
				params: {},
				data: { ...day, indicators },
				form: { ...day, day: '2026-11-10', indicators, ashtray: 'full' }
			}
		});
		expect(body).toContain('value="2026-11-10"');
		expect(body).toContain('Votre cendrier est plein.');
	});

	it.each(['missing-capacity', 'no-emptying', 'no-consumption', 'error', 'ok'] as const)(
		'masque la bannière tant que l’estimation du cendrier est %s',
		(ashtray) => {
		const { body } = render(Home, {
			props: { params: {}, form: null, data: { ...day, indicators: null, ashtray } }
		});
			expect(body).not.toContain('class="notice"');
			expect(body).not.toContain('Suivi du cendrier indisponible.');
			expect(body).not.toContain('Aucune consommation n’est disponible');
		}
	);

	it('traduit les textes accessibles et formate les nombres en anglais, même après soumission', () => {
		const indicators = { sampleCount: 2, conso: 12.35, ecs: 0, max: 8, min: null, missingSensors: false };
		const { body, head } = render(Home, {
			props: {
				params: {},
				data: { ...day, language: 'en', indicators },
				form: { ...day, day: '2026-11-10', indicators, ashtray: 'full' }
			}
		});
		expect(body).toContain('Daily charts');
		expect(body).toContain('aria-label="Previous day"');
		expect(body).toContain('aria-label="Unavailable"');
		expect(body).toContain('12.35');
		expect(body).toContain('Your ashtray is full.');
		expect(body).not.toContain('Votre cendrier est plein.');
		expect(head).toContain('Boiler monitoring');
	});
});
