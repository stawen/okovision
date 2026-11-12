import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import Layout from '../../src/routes/+layout.svelte';
import { handle, handleError } from '../../src/hooks.server';

describe('langue de l’interface', () => {
	afterEach(() => vi.unstubAllEnvs());

	it.each([
		['FR', 'fr'],
		['en', 'en']
	] as const)('transmet %s au layout et au HTML initial', async (configured, expected) => {
		vi.stubEnv('APP_LANG', configured);
		const partialEvent: Pick<RequestEvent, 'locals' | 'cookies' | 'setHeaders' | 'url' | 'route'> = {
			locals: { language: 'fr', member: null },
			cookies: { get: () => undefined, getAll: () => [], set: vi.fn(), delete: vi.fn(), serialize: vi.fn(), parse: vi.fn() },
			setHeaders: vi.fn(), url: new URL('http://localhost/'), route: { id: '/' }
		};
		const event = partialEvent as RequestEvent;
		const response = await handle({
			event,
			resolve: async (_event, options) => {
				const html = await options?.transformPageChunk?.({ html: '<html lang="%app.language%">', done: true });
				return new Response(html);
			}
		});
		expect(event.locals.language).toBe(expected);
		expect(await response.text()).toContain(`<html lang="${expected}">`);
	});

	it('refuse une langue invalide sans utiliser une autre langue', async () => {
		vi.stubEnv('APP_LANG', 'DE');
		const event = { locals: {} } as RequestEvent;
		await expect(handle({ event, resolve: async () => new Response() })).rejects.toThrow('APP_LANG');
	});

	it.each([
		['fr', 'Aller au contenu', 'Navigation principale'],
		['en', 'Skip to content', 'Main navigation']
	] as const)('traduit le layout en %s', (language, skip, navigation) => {
		const children = createRawSnippet(() => ({ render: () => '<div></div>' }));
		const { body } = render(Layout, { props: { params: {}, data: { language, member: null, pathname: '/' }, children } });
		expect(body).toContain(skip);
		expect(body).toContain(`aria-label="${navigation}"`);
	});

	it('traduit les erreurs de framework sans exposer de détails internes', () => {
		const event = { locals: { language: 'fr' } } as RequestEvent;
		expect(handleError({ kind: 'framework', error: { status: 404, message: 'Not Found' }, event }))
			.toEqual({ message: 'Page introuvable.' });
		const output = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			expect(handleError({ kind: 'unknown', error: new Error('détail privé'), event }))
				.toEqual({ message: 'Une erreur interne est survenue.' });
			expect(output).toHaveBeenCalledOnce();
		} finally {
			output.mockRestore();
		}
	});
});
