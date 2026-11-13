import { describe, expect, it, vi } from 'vitest';

const { enqueue } = vi.hoisted(() => ({
	enqueue: vi.fn()
}));

vi.mock('../../src/lib/server/jobs', () => ({
	getJobManager: async () => ({ enqueue })
}));

import { actions } from '../../src/routes/private/configuration/import-boiler/+page.server';

describe('retour de la demande d’import chaudière', () => {
	it('ne présente pas une tâche enregistrée comme un import terminé', async () => {
		const id = 'a4e7f416-01f3-4f37-90d4-bde93a899310';
		enqueue.mockResolvedValueOnce({ id });
		const action = actions.import;
		if (!action) throw new Error('Missing import action');
		type Event = Parameters<typeof action>[0];
		const form = new FormData();
		form.set('file', 'touch_20261113.csv');
		const event: Pick<Event, 'request' | 'locals'> = {
			request: new Request('http://localhost/private/configuration/import-boiler?/import', {
				method: 'POST',
				body: form
			}),
			locals: { language: 'fr', member: { id: 1, name: 'admin', type: 'admin' } }
		};

		expect(await action(event as Event)).toEqual({ jobId: id });
	});

	it('signale une erreur de persistance plutôt qu’un faux succès', async () => {
		enqueue.mockRejectedValueOnce(new Error('simulated persistence failure'));
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
		expect(await action(event as Event)).toMatchObject({
			status: 500, data: { error: 'Impossible d’enregistrer les relevés dans l’historique.' }
		});
	});
});
