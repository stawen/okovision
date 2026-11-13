import { describe, expect, it, vi } from 'vitest';

const { enqueue } = vi.hoisted(() => ({ enqueue: vi.fn() }));
vi.mock('../../src/lib/server/jobs', () => ({ getJobManager: async () => ({ enqueue }) }));

import { actions } from '../../src/routes/private/configuration/import-boiler/+page.server';

describe('import chaudière asynchrone', () => {
	it('reste sur la page et fournit la tâche après persistance de la demande', async () => {
		const id = 'a4e7f416-01f3-4f37-90d4-bde93a899310';
		enqueue.mockResolvedValueOnce({ id });
		const action = actions.import;
		if (!action) throw new Error('Missing import action');
		type Event = Parameters<typeof action>[0];
		const form = new FormData();
		form.set('file', 'touch_20261113.csv');
		const event: Pick<Event, 'request' | 'locals'> = {
			request: new Request('http://localhost/private/configuration/import-boiler?/import', {
				method: 'POST', body: form
			}),
			locals: { language: 'fr', member: { id: 1, name: 'admin', type: 'admin' } }
		};
		expect(await action(event as Event)).toEqual({ jobId: id });
		expect(enqueue).toHaveBeenCalledWith('import', '1', 'touch_20261113.csv');
	});

	it('ne crée pas de tâche pour un nom invalide', async () => {
		enqueue.mockClear();
		const action = actions.import;
		if (!action) throw new Error('Missing import action');
		type Event = Parameters<typeof action>[0];
		const form = new FormData();
		form.set('file', '../invalid.csv');
		const event: Pick<Event, 'request' | 'locals'> = {
			request: new Request('http://localhost/private/configuration/import-boiler?/import', {
				method: 'POST', body: form
			}),
			locals: { language: 'fr', member: { id: 1, name: 'admin', type: 'admin' } }
		};
		expect(await action(event as Event)).toMatchObject({ status: 400 });
		expect(enqueue).not.toHaveBeenCalled();
	});
});
