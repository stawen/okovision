import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle, init } from '../../src/hooks.server';
import { getSetupStatus } from '../../src/lib/server/setup';
import { initializeJobs } from '../../src/lib/server/scheduler';

vi.mock('../../src/lib/server/setup', () => ({ getSetupStatus: vi.fn() }));
vi.mock('../../src/lib/server/scheduler', () => ({ initializeJobs: vi.fn() }));

function event(path: NonNullable<RequestEvent['route']['id']>) {
	const partial: Pick<RequestEvent, 'locals' | 'cookies' | 'setHeaders' | 'url' | 'route'> = {
		locals: { language: 'fr', member: null },
		cookies: { get: () => undefined, getAll: () => [], set: vi.fn(), delete: vi.fn(), serialize: vi.fn(), parse: vi.fn() },
		setHeaders: vi.fn(),
		url: new URL(path, 'http://localhost'), route: { id: path }
	};
	return partial as RequestEvent;
}

describe('protection pendant la post-installation', () => {
	afterEach(() => vi.clearAllMocks());

	it('ne démarre ni les tâches persistées ni le collecteur avant configuration', async () => {
		vi.mocked(getSetupStatus).mockResolvedValue('configure');
		await init();
		await expect(handle({ event: event('/'), resolve: vi.fn() }))
			.rejects.toMatchObject({ status: 303, location: '/setup' });
		expect(initializeJobs).not.toHaveBeenCalled();
	});

	it.each(['/setup', '/login', '/api/v1/health'] as const)('garde %s accessible sans démarrer les tâches', async (path) => {
		vi.mocked(getSetupStatus).mockResolvedValue('configure');
		const resolve = vi.fn(async () => new Response('available'));
		const response = await handle({ event: event(path), resolve });
		expect(response.status).toBe(200);
		expect(initializeJobs).not.toHaveBeenCalled();
		if (path === '/api/v1/health') expect(getSetupStatus).not.toHaveBeenCalled();
	});

	it('reprend les tâches après configuration sans nécessiter de redémarrage', async () => {
		vi.mocked(getSetupStatus).mockResolvedValue('ready');
		await handle({ event: event('/'), resolve: async () => new Response('ready') });
		expect(initializeJobs).toHaveBeenCalledOnce();
	});

	it.each(['/api/v1/indicators', '/private/api/jobs'] as const)('renvoie 503 pour %s plutôt que du HTML de setup', async (path) => {
		vi.mocked(getSetupStatus).mockResolvedValue('configure');
		await expect(handle({ event: event(path), resolve: vi.fn() })).rejects.toMatchObject({ status: 503 });
		expect(initializeJobs).not.toHaveBeenCalled();
	});

	it('signale une panne DB en 503, sans présenter une base vierge', async () => {
		vi.mocked(getSetupStatus).mockRejectedValue(new Error('offline'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			await expect(handle({ event: event('/'), resolve: vi.fn() })).rejects.toMatchObject({ status: 503 });
			expect(log).toHaveBeenCalledOnce();
			expect(initializeJobs).not.toHaveBeenCalled();
		} finally {
			log.mockRestore();
		}
	});
});
