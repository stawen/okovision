import { json } from '@sveltejs/kit';
import { getDataAccess } from '#lib/server/data-access.js';
import { readConfiguration } from '#lib/server/config.js';
import { applyBoilerConfiguration, boilerErrorCode, getEditableBoilerSensor, validateEditableBoilerValue } from '#lib/server/boiler.js';
import { BoilerConfigurationError, currentLegacyTimestamp } from '#lib/server/repositories/boiler-configurations.js';
import { completeBoilerConfiguration } from '#lib/boiler-configurations.js';
import { logger } from '#lib/server/logger.js';
import type { RequestHandler } from './$types';

const log = logger.child({ component: 'boiler-configurations' });

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function timestamp(value: unknown): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0 || value > 4_294_967_295) {
		throw new BoilerConfigurationError('invalid');
	}
	return value;
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.member) return json({ error: 'unauthorized' }, { status: 401 });
	if (request.headers.get('origin') !== url.origin || !request.headers.get('content-type')?.startsWith('application/json')) {
		return json({ error: 'invalid' }, { status: 403 });
	}
	let operation = 'unknown';
	try {
		const input: unknown = await request.json();
		if (!isRecord(input) || typeof input.operation !== 'string') throw new BoilerConfigurationError('invalid');
		operation = input.operation;
		const repository = getDataAccess().boilerConfigurations;
		switch (operation) {
			case 'sensor': {
				if (typeof input.id !== 'string') throw new BoilerConfigurationError('invalid');
				return json({ sensor: await getEditableBoilerSensor(input.id) });
			}
			case 'validate': {
				if (typeof input.id !== 'string' || typeof input.value !== 'number') throw new BoilerConfigurationError('invalid');
				validateEditableBoilerValue(await getEditableBoilerSensor(input.id), input.value);
				return json({ valid: true });
			}
			case 'get':
				return json({ config: await repository.get(timestamp(input.timestamp)) });
			case 'delete':
				await repository.delete(timestamp(input.timestamp));
				return json({ deleted: true });
			case 'save': {
				if (typeof input.description !== 'string' || 'date' in input || !isRecord(input.previous)
					|| Object.keys(input.previous).length === 0) {
					throw new BoilerConfigurationError('invalid');
				}
				let values;
				try {
					values = completeBoilerConfiguration(input.config);
				} catch (cause) {
					throw new BoilerConfigurationError('invalid', { cause });
				}
				const changes: Record<string, { value: number; previous: number }> = {};
				for (const [id, previous] of Object.entries(input.previous)) {
					const entry = values[id];
					if (typeof previous !== 'number' || !Number.isFinite(previous) || !entry) throw new BoilerConfigurationError('invalid');
					const value = Number(entry.split(' ')[0]);
					if (!Number.isFinite(value) || value === previous) throw new BoilerConfigurationError('invalid');
					changes[id] = { value, previous };
				}
				const config = await readConfiguration();
				if (typeof config.timezone !== 'string' || !config.timezone) throw new BoilerConfigurationError('invalid');
				const time = currentLegacyTimestamp(config.timezone);
				await repository.save(time, input.description, values);
				log.info('boilerCommand', { memberId: locals.member.id, timestamp: time, sensors: Object.keys(changes), outcome: 'requested' });
				try {
					await applyBoilerConfiguration(changes);
				} catch (cause) {
					log.error('boilerConfigurationFailed', cause, { memberId: locals.member.id, timestamp: time, sensors: Object.keys(changes), outcome: boilerErrorCode(cause) });
					return json({ error: boilerErrorCode(cause), saved: true, timestamp: time }, { status: 409 });
				}
				log.info('boilerCommand', { memberId: locals.member.id, timestamp: time, sensors: Object.keys(changes), outcome: 'verified' });
				return json({ timestamp: time, applied: true });
			}
			default:
				throw new BoilerConfigurationError('invalid');
		}
	} catch (cause) {
		if (cause instanceof BoilerConfigurationError) return json({ error: cause.code }, { status: 400 });
		if (boilerErrorCode(cause) === 'invalid') return json({ error: 'invalid' }, { status: 400 });
		log.error('boilerConfigurationFailed', cause, { operation, memberId: locals.member.id });
		return json({ error: boilerErrorCode(cause) }, { status: 500 });
	}
};
