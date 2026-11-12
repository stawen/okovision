import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getBoilerIndicators, logError } = vi.hoisted(() => ({
	getBoilerIndicators: vi.fn(),
	logError: vi.fn()
}));
vi.mock('../../src/lib/server/boiler', () => ({
	getBoilerIndicators,
	boilerErrorCode: (cause: unknown) =>
		cause instanceof Error && 'code' in cause ? cause.code : 'unavailable',
}));
vi.mock('../../src/lib/server/logger', () => ({
	logger: { child: () => ({ error: logError }) }
}));

import { GET } from '../../src/routes/api/v1/chaudiere/indicateurs/+server';

type Event = Parameters<typeof GET>[0];

function event(query = '', member: Event['locals']['member'] = { id: 1, name: 'admin', type: 'admin' }) {
	const partial: Pick<Event, 'url' | 'locals'> = {
		url: new URL(`http://localhost/api/v1/chaudiere/indicateurs${query ? `?${query}` : ''}`),
		locals: { language: 'fr', member }
	};
	return partial as Event;
}

describe('API des indicateurs chaudière', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('exige une session membre avant de lire la chaudière', async () => {
		const response = await GET(event('', null));
		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'unauthorized' });
		expect(getBoilerIndicators).not.toHaveBeenCalled();
	});

	it.each(['circuit=0', 'circuit=-1', 'circuit=1.5', 'circuit=1&circuit=2'])(
		'rejette le circuit invalide : %s',
		async (query) => {
			const response = await GET(event(query));
			expect(response.status).toBe(400);
			expect(getBoilerIndicators).not.toHaveBeenCalled();
		}
	);

	it('retourne les mesures du premier circuit sans cache', async () => {
		const result = {
			circuit: 1,
			updatedAt: 123,
			readings: { burnerStarts: { value: 4, unit: '' } }
		};
		getBoilerIndicators.mockResolvedValue(result);
		const response = await GET(event());
		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual(result);
		expect(getBoilerIndicators).toHaveBeenCalledExactlyOnceWith(1);
	});

	it('retourne une erreur stable sans exposer le détail interne', async () => {
		const cause = Object.assign(new Error('internal detail'), { code: 'connection' });
		getBoilerIndicators.mockRejectedValue(cause);
		const response = await GET(event('circuit=2'));
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: 'connection' });
		expect(logError).toHaveBeenCalledWith('boilerReadFailed', expect.any(Error), {
			circuit: 2,
			failure: 'connection'
		});
	});
});
