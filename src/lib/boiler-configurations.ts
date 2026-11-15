import { editableRealtimeIndicators, legacySensorId } from './indicators/realtime.js';

export type BoilerConfiguration = Record<string, string>;

export function stepBoilerValue(
	value: string,
	sensor: { min: number; max: number; divisor: number },
	direction: 1 | -1
): string | null {
	if (!value.trim()) return null;
	const numeric = Number(value.replace(',', '.'));
	const raw = numeric * sensor.divisor;
	if (!Number.isFinite(numeric) || numeric < sensor.min || numeric > sensor.max
		|| !Number.isSafeInteger(Math.round(raw)) || Math.abs(raw - Math.round(raw)) > 1e-8) return null;
	const step = Math.max(1, Math.round(sensor.divisor / 10));
	const next = Math.min(Math.round(sensor.max * sensor.divisor),
		Math.max(Math.round(sensor.min * sensor.divisor), Math.round(raw) + direction * step));
	return String(next / sensor.divisor);
}

export function parseBoilerConfiguration(value: unknown): BoilerConfiguration {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid boiler configuration');
	const allowed = new Set(editableRealtimeIndicators.map(legacySensorId));
	const result: BoilerConfiguration = {};
	for (const [key, entry] of Object.entries(value)) {
		if (!allowed.has(key) || typeof entry !== 'string'
			|| !/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?(?: [^\s]{1,20})?$/i.test(entry) || !Number.isFinite(Number(entry.split(' ')[0]))) {
			throw new Error('Invalid boiler configuration');
		}
		result[key] = entry;
	}
	if (Object.keys(result).length === 0) throw new Error('Empty boiler configuration');
	return result;
}

export function completeBoilerConfiguration(value: unknown): BoilerConfiguration {
	const result = parseBoilerConfiguration(value);
	if (Object.keys(result).length !== editableRealtimeIndicators.length) throw new Error('Incomplete boiler configuration');
	return result;
}
