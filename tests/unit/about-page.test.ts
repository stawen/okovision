import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import About from '../../src/routes/private/about/+page.svelte';
import { _loadAboutData } from '../../src/routes/private/about/+page.server';

describe('page À propos et notes de mise à jour', () => {
	it('affiche la version courante et les notes historiques comme du texte, sans lien d’installation', () => {
		const { body, head } = render(About, {
			props: {
				params: {},
				form: null,
				data: {
					member: null,
					pathname: '/private/about',
					language: 'fr',
					applicationVersion: '0.0.1',
					updateFeedError: false,
					releases: [
						{ version: '1.10.1', date: '06/12/2020', changelog: '• Première version\n• <script>alert(1)</script>' }
					]
				}
			}
		});

		expect(head).toContain('À propos — OkoVision');
		expect(body).toContain('0.0.1');
		expect(body).toContain('Notes des versions publiées de l’application historique.');
		expect(body).toContain('&lt;script>alert(1)&lt;/script>');
		expect(body).not.toContain('<script>alert(1)');
		expect(body).not.toContain('href=');
		expect(body).not.toContain('Télécharger');
	});

	it('lit le flux en lecture seule, trie ses versions et convertit le changelog HTML en texte', async () => {
		const fetch = vi.fn(async () => new Response(JSON.stringify({
			'1.2.0': { url: 'https://example.test/installer.zip', date: '01/02/2020', changelog: '<ul><li>Correction &amp; évolution</li></ul>' },
			'1.10.0': { url: 'https://example.test/installer.zip', changelog: '<b>Nouvelle version</b>' },
			'invalide': { changelog: 'ignorée' }
		}), { headers: { 'content-type': 'application/json' } }));
		const result = await _loadAboutData(fetch, 'fr');

		expect(fetch).toHaveBeenCalledWith(
			'https://okovision.dronek.com/update.json',
			expect.objectContaining({ redirect: 'error', cache: 'no-store' })
		);
		expect(result.releases.map((release) => release.version)).toEqual(['1.10.0', '1.2.0']);
		expect(result.releases[1].changelog).toBe('• Correction & évolution');
		expect(result.releases[0].date).toBeNull();
		expect(JSON.stringify(result)).not.toContain('installer.zip');
	});

	it('signale un flux indisponible plutôt que de présenter une liste vide comme valide', async () => {
		const fetch = vi.fn(async () => new Response('unavailable', { status: 503 }));
		const result = await _loadAboutData(fetch, 'fr');

		expect(result).toMatchObject({ updateFeedError: true, releases: [] });
	});
});
