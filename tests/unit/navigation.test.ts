import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { pages, type ScopePath } from '../../src/lib/navigation';
import { uiMessages } from '../../src/lib/i18n';
import Layout from '../../src/routes/+layout.svelte';
import ScopePage from '../../src/lib/components/FunctionalScope.svelte';
import { handle } from '../../src/hooks.server';
import { createSession, revokeSession } from '../../src/lib/server/auth';

const member = { id: 1, name: 'member', type: 'admin' };
const children = createRawSnippet(() => ({ render: () => '<div></div>' }));
function event(path: ScopePath, token?: string) {
	const partial: Pick<RequestEvent, 'locals' | 'cookies' | 'route' | 'url' | 'setHeaders'> = {
		locals: { language: 'fr', member: null },
		cookies: { get: () => token, getAll: () => [], set: vi.fn(), delete: vi.fn(), serialize: vi.fn(), parse: vi.fn() },
		route: { id: path },
		url: new URL(path, 'http://localhost'),
		setHeaders: vi.fn()
	};
	return partial as RequestEvent;
}

describe('navigation de la cartographie', () => {
	it('rend les liens publics et réserve les menus privés aux membres', () => {
		const anonymous = render(Layout, {
			props: { params: {}, children, data: { language: 'fr', member: null, pathname: '/history' } }
		}).body;
		expect(anonymous).toContain('href="/history" aria-current="page"');
		expect(anonymous).toContain('href="/login"');
		expect(anonymous).not.toContain('href="/migration"');
		expect(anonymous).not.toContain('href="/private/');
		expect(anonymous).not.toContain('action="/private/logout"');

		const connected = render(Layout, {
			props: { params: {}, children, data: { language: 'fr', member, pathname: '/private/account' } }
		}).body;
		for (const page of pages.filter((page) => page.private && page.group !== 'realtime')) {
			expect(connected).toContain(`href="${page.path}"`);
		}
		expect(connected).toContain('href="/private/realtime/settings"');
		expect(connected).toContain('action="/private/logout"');
		expect(connected).toContain('method="POST"');
		expect(connected).not.toContain('href="/migration"');
		expect(connected).not.toMatch(/(?:href|src)="[^"]*(?:archive\/|\.php)/);
	});

	it.each(pages.filter((page) => page.private))('protège la page $path lors d’un accès direct', async (page) => {
		const resolve = vi.fn(async () => new Response('private'));
		await expect(handle({ event: event(page.path), resolve })).rejects.toMatchObject({ status: 303, location: '/login' });
		expect(resolve).not.toHaveBeenCalled();
	});

	it.each(pages)('rend uniquement le périmètre de $path, sans formulaire métier', (page) => {
		const { body } = render(ScopePage, {
			props: {
				path: page.path,
				language: 'fr'
			}
		});
		expect(body).toContain(uiMessages('fr')[page.titleKey]);
		expect(body).toContain('fonctionnalités ne sont pas encore disponibles');
		expect(body).not.toContain('<form');
		if (page.group === 'realtime') {
			for (const tab of pages.filter((item) => item.group === 'realtime')) {
				expect(body).toContain(`href="${tab.path}"`);
			}
		}
	});

	it('traduit les titres, descriptions, onglets et menus depuis le catalogue global en anglais', () => {
		const { body, head } = render(ScopePage, {
			props: { path: '/private/realtime/settings', language: 'en' }
		});
		expect(body).toContain('Boiler settings');
		expect(body).toContain('Operating indicators, heating, radiator water management and burner settings.');
		expect(body).toContain('Configuration tracking');
		expect(body).not.toContain('Réglages chaudière');
		expect(head).toContain('Boiler settings — OkoVision');
		const menu = render(Layout, {
			props: { params: {}, children, data: { language: 'en', member, pathname: '/private/realtime/settings' } }
		}).body;
		expect(menu).toContain('Daily report management');
		expect(menu).toContain('Sign out');
	});

	it('laisse l’historique public et autorise les pages privées uniquement avec une session valide', async () => {
		await expect(handle({ event: event('/history'), resolve: async () => new Response('public') }))
			.resolves.toHaveProperty('status', 200);
		const token = createSession(member);
		try {
			const request = event('/private/administration/settings', token);
			const response = await handle({ event: request, resolve: async () => new Response('private') });
			expect(await response.text()).toBe('private');
			expect(request.locals.member).toEqual(member);
			expect(request.setHeaders).toHaveBeenCalledWith({ 'cache-control': 'no-store' });
		} finally {
			revokeSession(token);
		}
	});
});
