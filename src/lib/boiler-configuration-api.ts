import { resolve } from '$app/paths';

export class ConfigurationRequestError extends Error {
	constructor(readonly code: string, readonly savedTimestamp: number | null = null) {
		super(code);
	}
}

export function isObject(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function configurationRequest(input: Record<string, unknown>): Promise<Record<string, unknown>> {
	const response = await fetch(resolve('/private/api/boiler-configurations'), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		signal: AbortSignal.timeout(30_000),
		body: JSON.stringify(input)
	});
	const result: unknown = await response.json();
	if (!isObject(result)) throw new ConfigurationRequestError('response');
	if (!response.ok) throw new ConfigurationRequestError(
		typeof result.error === 'string' ? result.error : 'response',
		result.saved === true && typeof result.timestamp === 'number' && Number.isSafeInteger(result.timestamp) && result.timestamp > 0
			? result.timestamp : null
	);
	return result;
}
