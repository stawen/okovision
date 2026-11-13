import { describe, expect, it, vi } from 'vitest';

const { importBoilerCsvFile } = vi.hoisted(() => ({
	importBoilerCsvFile: vi.fn()
}));

vi.mock('../../src/lib/server/boiler-import', () => ({
	importBoilerCsvFile,
	getBoilerCsvFiles: vi.fn()
}));

import { actions } from '../../src/routes/private/configuration/import-boiler/+page.server';

describe('notification de fin d’import chaudière', () => {
	it.each([
		{ count: 0, label: '0 ligne' },
		{ count: 1, label: '1 ligne' },
		{ count: 2, label: '2 lignes' }
	])('affiche $label', async ({ count, label }) => {
		importBoilerCsvFile.mockResolvedValueOnce(count);
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

		expect(await action(event as Event)).toEqual({
			successCount: count,
			successMessage: `Importantion terminé du fichier du 13/11/2026 de ${label}`
		});
	});
});
