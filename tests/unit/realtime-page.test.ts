import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import RealtimeSettings from '../../src/routes/private/realtime/settings/+page.svelte';

describe('page des indicateurs temps réel', () => {
	it('reprend les rubriques et les libellés du legacy, avec valeur avant libellé', () => {
		const { body } = render(RealtimeSettings, {
			props: {
				params: {},
				form: null,
				data: {
					member: null,
					pathname: '/private/realtime/settings',
					language: 'fr',
					indicators: {
						circuit: 1,
						updatedAt: 1794355200000,
						readings: {
							averageBurnerRunTime: { value: 60, unit: 's' },
							outsideTemperature: { value: 8.5, unit: '°C' },
							roomTemperature: { value: 21, unit: '°C' },
							boilerPower: { value: null, unit: '' }
						}
					},
					realtimeError: null
				}
			}
		});
		expect(body).toContain('Indicateurs de fontionnement');
		expect(body).toContain('Chauffage - T°C ambiante');
		expect(body).toContain('Chauffage - Gestion eau dans Radiateur');
		expect(body).toContain('Paramétrage brûleur');
		expect(body).toContain('60 s');
		expect(body.indexOf('60 s')).toBeLessThan(body.lastIndexOf('Temps moyen du brûleur'));
		expect(body).not.toContain('Températures');
		expect(body).not.toContain('8,5');
		expect(body).toContain('Non disponible');
		expect(body).toContain('aria-label="Information : Temps moyen du brûleur"');
		expect(body).toContain('aria-describedby="realtime-tooltip-averageBurnerRunTime"');
		expect(body).toContain('Le temps moyen doit être compris entre 25 min et 45 min.');
		expect(body.match(/class="realtime-reading"/g)).toHaveLength(24);
		expect(body.match(/class="realtime-info"/g)).toHaveLength(21);
		expect(body).toContain('Graphiques');
		expect(body).toContain('Suivi configuration');
	});

	it.each([
		{ language: 'fr' as const, withoutInfo: ['Nb démarrage brûleur', 'Total Fonction. brûleur', "Nombre d'allumages"] },
		{ language: 'en' as const, withoutInfo: ['Burner start number', 'Total Burner operation', 'Ignitions Number'] }
	])('masque les icônes lorsque le texte est vide en $language', ({ language, withoutInfo }) => {
		const { body } = render(RealtimeSettings, {
			props: {
				params: {},
				form: null,
				data: {
					member: null,
					pathname: '/private/realtime/settings',
					language,
					indicators: null,
					realtimeError: 'connection'
				}
			}
		});
		const cards = body.match(/<article class="realtime-reading">[\s\S]*?<\/article>/g) ?? [];
		for (const label of withoutInfo) {
			const card = cards.find((item) => item.includes(label));
			expect(card).toBeDefined();
			expect(card).not.toContain('realtime-info');
		}
		expect(body.match(/class="realtime-info"/g)).toHaveLength(21);
	});

	it('signale une erreur de connexion sans présenter de valeurs simulées', () => {
		const { body } = render(RealtimeSettings, {
			props: {
				params: {},
				form: null,
				data: {
					member: null,
					pathname: '/private/realtime/settings',
					language: 'fr',
					indicators: null,
					realtimeError: 'connection'
				}
			}
		});
		expect(body).toContain('Chaudière injoignable ou authentification refusée.');
		expect(body).not.toContain('21');
		expect(body).not.toContain('0,00');
	});
});
