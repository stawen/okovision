import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../src/routes/api/v1/indicators/+server';

const { getDailyIndicators, readInstallationConfig, logError } = vi.hoisted(() => ({
	getDailyIndicators: vi.fn(), readInstallationConfig: vi.fn(), logError: vi.fn()
}));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({ measurements: { getDailyIndicators } })
}));
vi.mock('../../src/lib/server/config', () => ({ readInstallationConfig }));
vi.mock('../../src/lib/server/logger', () => ({
	logger: { child: () => ({ error: logError }) }
}));

type Event = Parameters<typeof GET>[0];
function event(query: string) {
	const partial: Pick<Event, 'url' | 'locals'> = {
		url: new URL(`https://localhost/api/v1/indicators?${query}`),
		locals: { language: 'fr', member: null }
	};
	return partial as Event;
}

describe('API des indicateurs par plage', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		readInstallationConfig.mockResolvedValue({ poidsPellet: 156, timezone: 'Europe/Paris' });
	});

	it('transmet la journée et la plage au repository sans exposer de configuration', async () => {
		const indicators = { sampleCount: 1, conso: 0, ecs: null, max: 8, min: -2, missingSensors: false };
		getDailyIndicators.mockResolvedValue(indicators);
		const response = await GET(event('jour=2026-01-01&min=1000&max=2000'));
		expect(getDailyIndicators).toHaveBeenCalledExactlyOnceWith('2026-01-01', 156, { min: 1000, max: 2000 });
		expect(await response.json()).toEqual(indicators);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});

	it('permet de demander la journée complète sans plage', async () => {
		getDailyIndicators.mockResolvedValue({ sampleCount: 0, conso: null, ecs: null, max: null, min: null, missingSensors: false });
		await GET(event('jour=2026-01-01'));
		expect(getDailyIndicators).toHaveBeenCalledWith('2026-01-01', 156, undefined);
	});

	it.each([
		'jour=2026-02-30', 'jour=9999-01-01', 'jour=2026-01-01&min=1',
		'jour=2026-01-01&min=&max=2', 'jour=2026-01-01&min=NaN&max=2',
		'jour=2026-01-01&min=2&max=1', 'jour=2026-01-01&min=1&max=Infinity',
		'jour=2026-01-01&min=1&max=1'
	])('rejette une date ou une plage invalide : %s', async (query) => {
		await expect(GET(event(query))).rejects.toMatchObject({ status: 400 });
		expect(getDailyIndicators).not.toHaveBeenCalled();
	});

	it('signale la panne SQL sans divulguer son détail', async () => {
		getDailyIndicators.mockRejectedValue(new Error('private database details'));
		await expect(GET(event('jour=2026-01-01&min=1&max=2'))).rejects.toMatchObject({
			status: 503, body: { message: 'Impossible de charger les indicateurs.' }
		});
		expect(logError).toHaveBeenCalledWith('dailyIndicatorsFailed', expect.any(Error), {
			day: '2026-01-01', range: { min: 1, max: 2 }
		});
	});
});
