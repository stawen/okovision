import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Home from '../../src/routes/+page.svelte';

describe('migration landing page', () => {
	it('shows unavailable indicators instead of simulated measurements', () => {
		const { body } = render(Home);

		expect(body.match(/aria-label="Non disponible"/g)).toHaveLength(4);
		expect(body).toContain('Aucune base ni chaudière');
		expect(body).toContain('Non connecté');
		expect(body).not.toContain('00,00');
	});

	it('links to an existing migration section without calling the archived application', () => {
		const { body } = render(Home);

		expect(body).toContain('href="#migration"');
		expect(body).toContain('id="migration"');
		expect(body).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});
});
