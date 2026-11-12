import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import History from '../../src/routes/history/+page.svelte';

const emptyData = {
	language: 'fr' as const,
	member: null,
	pathname: '/history' as const,
	month: 11,
	year: 2026,
	years: [2026, 2025],
	seasons: [],
	selectedSeasonId: null,
	monthly: null,
	seasonal: null,
	today: '2026-11-12',
	stock: { status: 'unavailable' as const },
	databaseError: false
};

describe('historique', () => {
	it('affiche les périodes vides sans valeurs simulées ni accès au PHP archivé', () => {
		const { body, head } = render(History, { props: { params: {}, form: null, data: emptyData } });
		expect(head).toContain('Historique — OkoVision');
		expect(body).toContain('Synthèse mensuelle');
		expect(body).toContain('Synthèse de saison');
		expect(body).toContain('Stock de pellets');
		expect(body).toContain('Aucune donnée à représenter pour cette période.');
		expect(body).toContain('Suivi du stock indisponible');
		expect(body).not.toContain('role="progressbar"');
		expect(body).not.toContain('0,00');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it.each([
		{ max: [50], min: [-10], consumption: [80], dju: [80], cycles: [60], warning: false },
		{ max: [51], min: [0], consumption: [0], dju: [0], cycles: [0], warning: true },
		{ max: [0], min: [-11], consumption: [0], dju: [0], cycles: [0], warning: true },
		{ max: [0], min: [0], consumption: [81], dju: [0], cycles: [0], warning: true },
		{ max: [0], min: [0], consumption: [0], dju: [-1], cycles: [0], warning: true },
		{ max: [0], min: [0], consumption: [0], dju: [0], cycles: [61], warning: true }
	])('signale les valeurs mensuelles hors des limites fixes', ({ warning, ...chart }) => {
		const indicators = { sampleCount: 1, conso: null, ecs: null, max: null, mean: null, min: null, dju: null, cycles: null };
		const { body } = render(History, {
			props: { params: {}, form: null, data: { ...emptyData, monthly: { indicators, chart }, seasonal: null } }
		});
		expect(body.includes('Certaines valeurs dépassent les limites fixes du graphique.')).toBe(warning);
	});

	it.each([
		{ max: 50, min: 50, consumption: 2000, dju: 2000, cycles: 400, ecs: 2000, month: 10, warning: false },
		{ max: 51, min: 0, consumption: 0, dju: 0, cycles: 0, ecs: 0, month: 10, warning: true },
		{ max: 0, min: 0, consumption: 2001, dju: 0, cycles: 0, ecs: 0, month: 10, warning: true },
		{ max: 0, min: 0, consumption: 0, dju: 0, cycles: 401, ecs: 0, month: 10, warning: true },
		{ max: 0, min: 0, consumption: 0, dju: 0, cycles: 0, ecs: 2001, month: 10, warning: true },
		{ max: 51, min: 0, consumption: 2001, dju: 0, cycles: 401, ecs: 0, month: 11, warning: false }
	])('signale les valeurs saisonnières représentées au-delà des limites fixes', ({ warning, ...values }) => {
		const indicators = { sampleCount: 1, conso: null, ecs: null, max: null, mean: null, min: null, dju: null, cycles: null };
		const season = { id: 1, name: 'Saison', startDate: '2026-09-01', endDate: '2027-08-31' };
		const { body } = render(History, {
			props: { params: {}, form: null, data: {
				...emptyData,
				monthly: { indicators, chart: { max: [], min: [], consumption: [], dju: [], cycles: [] } },
				seasonal: { season, indicators, months: [{ ...values, year: 2026, sampleCount: 1, efficiency: null }] }
			} }
		});
		expect(body.includes('Certaines valeurs dépassent les limites fixes du graphique.')).toBe(warning);
	});

	it('affiche les données, les zéros réels, la sélection et la table de saison', () => {
		const indicators = { sampleCount: 1, conso: 12.5, ecs: 0, max: 8, mean: 3, min: -2, dju: 10, cycles: 4 };
		const season = { id: 2, name: '2025-2026', startDate: '2025-09-01', endDate: '2026-08-31' };
		const { body } = render(History, {
			props: {
				params: {},
				form: null,
				data: {
					...emptyData,
					seasons: [season],
					selectedSeasonId: 2,
					stock: { status: 'available', remains: 1800, percent: 45 },
					monthly: {
						indicators,
						chart: { max: [8], min: [-2], consumption: [12.5], dju: [10], cycles: [4] }
					},
					seasonal: {
						season,
						indicators,
						months: [{
							year: 2026, month: 1, sampleCount: 1, max: 8, min: -2,
							consumption: 12.5, ecs: 0, dju: 10, cycles: 4, efficiency: 8.33
						}]
					}
				}
			}
		});

		expect(body).toContain('12,50');
		expect(body).toContain('0,00');
		expect(body).toContain('8,33');
		expect(body).toContain('janvier 2026');
		expect(body).toContain('2025-2026');
		expect(body).toContain('Stock estimé');
		expect(body).toContain('45 %');
		expect(body).toContain('name="month"');
		expect(body).toContain('name="season"');
		expect(body).not.toContain('Aucune donnée à représenter pour cette période.');
	});

	it.each([
		{ month: 1, year: 2026, previous: 'month=12&amp;year=2025', next: 'month=2&amp;year=2026' },
		{ month: 12, year: 2025, previous: 'month=11&amp;year=2025', next: 'month=1&amp;year=2026' }
	])('navigue de mois en mois avec le changement d’année et conserve la saison', ({ month, year, previous, next }) => {
		const season = { id: 2, name: 'Saison', startDate: '2025-09-01', endDate: '2026-08-31' };
		const indicators = { sampleCount: 0, conso: null, ecs: null, max: null, mean: null, min: null, dju: null, cycles: null };
		const monthly = { indicators, chart: { max: [], min: [], consumption: [], dju: [], cycles: [] } };
		const { body } = render(History, {
			props: { params: {}, form: null, data: { ...emptyData, month, year, monthly, seasons: [season], selectedSeasonId: 2 } }
		});
		expect(body).toContain(`href="/history?${previous}&amp;season=2"`);
		expect(body).toContain(`href="/history?${next}&amp;season=2"`);
		expect(body).toContain('aria-label="Mois précédent"');
		expect(body).toContain('aria-label="Mois suivant"');
	});

	it('désactive les flèches lorsque l’année adjacente est absente', () => {
		const { body } = render(History, {
			props: { params: {}, form: null, data: { ...emptyData, month: 1, year: 2025, years: [2026, 2025] } }
		});
		expect(body).toMatch(/aria-label="Mois précédent" aria-disabled="true"/);
		expect(body).toContain('href="/history?month=2&amp;year=2025"');
	});

	it('désactive les filtres mensuels en l’absence d’années', () => {
		const { body } = render(History, {
			props: { params: {}, form: null, data: { ...emptyData, years: [] } }
		});
		expect(body).toMatch(/name="year" aria-label="Année" disabled/);
		expect(body).toMatch(/name="month" aria-label="Mois" disabled/);
		expect(body).toContain('Indisponible');
		expect(body).toMatch(/aria-label="Mois suivant" aria-disabled="true"/);
	});

	it('signale une erreur de base et conserve les libellés anglais', () => {
		const { body } = render(History, {
			props: {
				params: {},
				form: null,
				data: { ...emptyData, language: 'en', databaseError: true, stock: { status: 'error' } }
			}
		});
		expect(body).toContain('Unable to load historical data.');
		expect(body).toContain('Unable to load stock.');
		expect(body).toContain('Degree days');
		expect(body).toContain('Incl. hot water');
		expect(body).not.toContain('Synthèse mensuelle');
	});

	it.each([
		{ language: 'fr', unavailable: 'Non disponible', zero: '0,00' },
		{ language: 'en', unavailable: 'Unavailable', zero: '0.00' }
	] as const)('affiche un tiret accessible pour chaque valeur manquante en $language, sans masquer les zéros', ({ language, unavailable, zero }) => {
		const season = { id: 2, name: 'Saison', startDate: '2026-01-01', endDate: '2026-02-28' };
		const indicators = { sampleCount: 1, conso: 0, ecs: null, max: null, mean: null, min: null, dju: null, cycles: 0 };
		const { body } = render(History, {
			props: {
				params: {},
				form: null,
				data: {
					...emptyData,
					language,
					monthly: {
						indicators,
						chart: { max: [], min: [], consumption: [], dju: [], cycles: [] }
					},
					seasonal: {
						season,
						indicators,
						months: [
							{ year: 2026, month: 1, sampleCount: 0, max: null, min: null, consumption: null, ecs: null, dju: null, cycles: null, efficiency: null },
							{ year: 2026, month: 2, sampleCount: 1, max: null, min: null, consumption: 0, ecs: null, dju: null, cycles: 0, efficiency: null }
						]
					}
				}
			}
		});
		const table = body.match(/<tbody\b[^>]*>[\s\S]*?<\/tbody>/)?.[0] ?? '';
		expect(table.match(/aria-hidden="true">-<\/span>/g)).toHaveLength(8);
		expect(table.match(new RegExp(`class="visually-hidden">${unavailable}</span>`, 'g'))).toHaveLength(8);
		expect(table).toContain(zero);
		expect(table).toMatch(/<td[^>]*>(?:<!--.*?-->)*0(?:<!--.*?-->)*<\/td>/);
	});

	it.each([
		{ percent: 51, tone: 'normal' },
		{ percent: 50, tone: 'warning' },
		{ percent: 25, tone: 'warning' },
		{ percent: 24, tone: 'danger' },
		{ percent: 0, tone: 'danger' }
	])('applique la couleur legacy au stock à $percent %', ({ percent, tone }) => {
		const { body } = render(History, {
			props: {
				params: {},
				form: null,
				data: { ...emptyData, stock: { status: 'available', percent, remains: 100 } }
			}
		});
		const fillClass = body.match(/class="(stock-fill[^"]*)"/)?.[1];
		expect(fillClass).toBeDefined();
		if (tone === 'normal') {
			expect(fillClass).not.toMatch(/warning|danger/);
		} else {
			expect(fillClass).toContain(tone);
		}
		expect(body).toContain('role="progressbar"');
		expect(body).toContain(`aria-valuenow="${percent}"`);
		expect(body).toContain(`width: ${percent}%`);
		expect(body).toContain(`${percent} % (100 kg)`);
	});

	it.each([
		{ percent: -10, bounded: 0 },
		{ percent: 125, bounded: 100 }
	])('borne la barre à $bounded % sans masquer l’estimation de $percent %', ({ percent, bounded }) => {
		const { body } = render(History, {
			props: {
				params: {},
				form: null,
				data: { ...emptyData, language: 'en', stock: { status: 'available', percent, remains: 100 } }
			}
		});
		expect(body).toContain(`aria-valuenow="${bounded}"`);
		expect(body).toContain(`width: ${bounded}%`);
		expect(body).toContain(`Estimated stock : ${percent} % (100 kg)`);
	});

	it.each([
		{ status: 'no-fill', message: 'Aucun remplissage enregistré.' },
		{ status: 'no-consumption', message: 'Consommation depuis le remplissage indisponible.' },
		{ status: 'error', message: 'Impossible de charger le stock.' }
	] as const)('conserve le message lorsque le stock est $status', ({ status, message }) => {
		const { body } = render(History, {
			props: { params: {}, form: null, data: { ...emptyData, stock: { status } } }
		});
		expect(body).toContain(message);
		expect(body).not.toContain('role="progressbar"');
	});
});
