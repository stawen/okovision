import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	save: vi.fn(), get: vi.fn(), delete: vi.fn(), apply: vi.fn(), sensor: vi.fn(), validate: vi.fn(), readConfiguration: vi.fn(), info: vi.fn(), error: vi.fn()
}));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({ boilerConfigurations: { save: mocks.save, get: mocks.get, delete: mocks.delete } })
}));
vi.mock('../../src/lib/server/config', () => ({ readConfiguration: mocks.readConfiguration }));
vi.mock('../../src/lib/server/boiler', () => ({
	applyBoilerConfiguration: mocks.apply,
	getEditableBoilerSensor: mocks.sensor,
	validateEditableBoilerValue: mocks.validate,
	boilerErrorCode: (cause: unknown) => cause instanceof Error && 'code' in cause ? cause.code : 'unavailable'
}));
vi.mock('../../src/lib/server/logger', () => ({
	logger: { child: () => ({ info: mocks.info, error: mocks.error }) }
}));

import { POST } from '../../src/routes/private/api/boiler-configurations/+server';
import { editableRealtimeIndicators, legacySensorId } from '../../src/lib/indicators/realtime';
import { configurationRequest, ConfigurationRequestError } from '../../src/lib/boiler-configuration-api';

const config = Object.fromEntries(editableRealtimeIndicators.map((indicator) => [legacySensorId(indicator), '21 °C']));

type Event = Parameters<typeof POST>[0];
function event(body: unknown, options: { origin?: string; member?: Event['locals']['member'] } = {}): Event {
	const url = new URL('http://localhost/private/api/boiler-configurations');
	const request = new Request(url, {
		method: 'POST',
		headers: { origin: options.origin ?? url.origin, 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	const partial: Pick<Event, 'url' | 'request' | 'locals'> = {
		url, request, locals: { language: 'fr', member: options.member === undefined ? { id: 1, name: 'admin', type: 'admin' } : options.member }
	};
	return partial as Event;
}

describe('API privée de suivi des configurations', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.readConfiguration.mockResolvedValue({ timezone: 'Europe/Paris' });
	});

	it('refuse une session absente et une origine étrangère', async () => {
		expect((await POST(event({ operation: 'delete', timestamp: 1 }, { member: null }))).status).toBe(401);
		expect((await POST(event({ operation: 'delete', timestamp: 1 }, { origin: 'https://other.example' }))).status).toBe(403);
		expect(mocks.delete).not.toHaveBeenCalled();
	});

	it('enregistre puis applique les seules modifications avec la date et l’heure actuelles', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-02T03:04:05Z'));
		try {
			const response = await POST(event({ operation: 'save', description: 'test', config, previous: { hk0_raumtemp_heizen: 20 } }));
			expect(response.status).toBe(200);
			expect(mocks.save).toHaveBeenCalledWith(Date.parse('2026-01-02T04:04:05Z') / 1000, 'test', config);
			expect(mocks.apply).toHaveBeenCalledExactlyOnceWith({ hk0_raumtemp_heizen: { previous: 20, value: 21 } });
			expect(mocks.save.mock.invocationCallOrder[0]).toBeLessThan(mocks.apply.mock.invocationCallOrder[0]);
			expect(await response.json()).toEqual({ timestamp: Date.parse('2026-01-02T04:04:05Z') / 1000, applied: true });
		} finally {
			vi.useRealTimers();
		}
	});

	it('refuse une date fournie par le client', async () => {
		const response = await POST(event({ operation: 'save', date: '2020-01-01T00:00', description: 'test', config, previous: { hk0_raumtemp_heizen: 20 } }));
		expect(response.status).toBe(400);
		expect(mocks.save).not.toHaveBeenCalled();
	});

	it('valide une saisie avec les limites relues avant de la préparer', async () => {
		const sensor = { value: 20, min: 10, max: 30, divisor: 10, unit: '°C' };
		mocks.sensor.mockResolvedValue(sensor);
		const response = await POST(event({ operation: 'validate', id: 'hk0_raumtemp_heizen', value: 21 }));
		expect(response.status).toBe(200);
		expect(mocks.validate).toHaveBeenCalledExactlyOnceWith(sensor, 21);
		expect(mocks.apply).not.toHaveBeenCalled();
	});

	it('refuse une sauvegarde sans modification', async () => {
		const response = await POST(event({ operation: 'save', description: 'test', config, previous: {} }));
		expect(response.status).toBe(400);
		expect(mocks.save).not.toHaveBeenCalled();
		expect(mocks.apply).not.toHaveBeenCalled();
	});

	it('refuse un paramètre absent de l’instantané avant enregistrement et commande', async () => {
		const response = await POST(event({ operation: 'save', description: 'test', config, previous: { other: 20 } }));
		expect(response.status).toBe(400);
		expect(mocks.save).not.toHaveBeenCalled();
		expect(mocks.apply).not.toHaveBeenCalled();
	});

	it('ne commande pas la chaudière lorsque la sauvegarde échoue', async () => {
		mocks.save.mockRejectedValue(new Error('database'));
		const response = await POST(event({ operation: 'save', description: 'test', config, previous: { hk0_raumtemp_heizen: 20 } }));
		expect(response.status).toBe(500);
		expect(mocks.apply).not.toHaveBeenCalled();
	});

	it('signale la sauvegarde et ne présente pas une application incertaine comme un succès', async () => {
		mocks.apply.mockRejectedValue(Object.assign(new Error('timeout'), { code: 'uncertain' }));
		const response = await POST(event({ operation: 'save', description: 'test', config, previous: { hk0_raumtemp_heizen: 20 } }));
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: 'uncertain', saved: true, timestamp: expect.any(Number) });
		expect(mocks.save).toHaveBeenCalledOnce();
		expect(mocks.apply).toHaveBeenCalledOnce();
		expect(mocks.error).toHaveBeenCalledOnce();
	});

	it('transmet au client la date de la sauvegarde en cas d’échec de la commande', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ error: 'uncertain', saved: true, timestamp: 123 }), { status: 409 })
		));
		try {
			await expect(configurationRequest({ operation: 'save' })).rejects.toMatchObject({
				code: 'uncertain', savedTimestamp: 123
			} satisfies Partial<ConfigurationRequestError>);
		} finally {
			vi.unstubAllGlobals();
		}
	});
});
