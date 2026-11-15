import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	dev: true,
	getManager: vi.fn(),
	enqueueCollection: vi.fn(),
	logError: vi.fn()
}));
vi.mock('$app/env', () => ({ get dev() { return mocks.dev; } }));
vi.mock('../../src/lib/server/jobs', () => ({ getJobManager: mocks.getManager }));
vi.mock('../../src/lib/server/logger', () => ({
	logger: { child: () => ({ error: mocks.logError }) }
}));

import { POST } from '../../src/routes/api/v1/scheduler/+server';

type Event = Parameters<typeof POST>[0];
function event(member: Event['locals']['member'] = { id: 1, name: 'admin', type: 'admin' }, origin: string | null = 'http://localhost') {
	const url = new URL('http://localhost/api/v1/scheduler');
	const partial: Pick<Event, 'url' | 'request' | 'locals'> = {
		url,
		request: new Request(url, { method: 'POST', headers: origin ? { origin } : {} }),
		locals: { language: 'fr', member }
	};
	return partial as Event;
}

describe('déclenchement manuel du scheduler', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.dev = true;
		mocks.getManager.mockResolvedValue({ enqueueCollection: mocks.enqueueCollection });
	});

	it('est indisponible hors développement', async () => {
		mocks.dev = false;
		const response = await POST(event());
		expect(response.status).toBe(404);
		expect(mocks.getManager).not.toHaveBeenCalled();
	});

	it('exige une session', async () => {
		const response = await POST(event(null));
		expect(response.status).toBe(401);
		expect(mocks.getManager).not.toHaveBeenCalled();
	});

	it('refuse les membres non administrateurs', async () => {
		const response = await POST(event({ id: 2, name: 'member', type: 'user' }));
		expect(response.status).toBe(403);
		expect(mocks.getManager).not.toHaveBeenCalled();
	});

	it.each([null, 'http://other-host', 'null'])('refuse une origine absente ou étrangère : %s', async (origin) => {
		const response = await POST(event(undefined, origin));
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'invalid-origin' });
		expect(mocks.getManager).not.toHaveBeenCalled();
	});

	it('accepte une collecte ponctuelle et retourne la tâche sans cache', async () => {
		const job = { id: 'job-id', kind: 'collection', status: 'queued', author: '1', manual: true };
		mocks.enqueueCollection.mockResolvedValue(job);
		const response = await POST(event());
		expect(response.status).toBe(202);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual(job);
		expect(mocks.getManager).toHaveBeenCalledExactlyOnceWith(false);
		expect(mocks.enqueueCollection).toHaveBeenCalledExactlyOnceWith('1');
	});

	it.each(['manager', 'enqueue'])('signale un échec de %s sans exposer ses détails', async (operation) => {
		const cause = new Error('internal detail');
		if (operation === 'manager') mocks.getManager.mockRejectedValue(cause);
		else mocks.enqueueCollection.mockRejectedValue(cause);
		const response = await POST(event());
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'unavailable' });
		expect(mocks.logError).toHaveBeenCalledExactlyOnceWith('collectionFailed', cause, {
			operation: 'manual', memberId: 1
		});
	});
});
