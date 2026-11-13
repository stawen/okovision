import { getMessages } from './messages.ts';
import { readBoilerAddress } from './config.ts';
import type { BoilerCredentials } from './repositories/users.ts';
import {
	realtimeIndicators,
	realtimeSensorNames,
	type RealtimeData,
	type RealtimeReading
} from '../indicators/realtime.ts';

export type BoilerErrorCode = 'configuration' | 'credentials' | 'database' | 'connection' | 'response' | 'unavailable';

export class BoilerError extends Error {
	constructor(readonly code: BoilerErrorCode, message: string, cause?: unknown) {
		super(message, cause === undefined ? undefined : { cause });
		this.name = 'BoilerError';
	}
}

export function boilerErrorCode(cause: unknown): BoilerErrorCode {
	return cause instanceof BoilerError ? cause.code : 'unavailable';
}

interface BoilerSensor {
	name?: unknown;
	value?: unknown;
	unitText?: unknown;
	formatTexts?: unknown;
	divisor?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function boilerError(code: BoilerErrorCode): BoilerError {
	const messages = getMessages();
	const message = code === 'configuration'
		? messages.boilerConfigInvalid
		: code === 'credentials'
			? messages.boilerCredentialsUnavailable
			: code === 'database'
				? messages.boilerCredentialsLoadFailed
				: code === 'response'
					? messages.boilerResponseInvalid
					: messages.boilerConnectionFailed;
	return new BoilerError(code, message);
}

/** Normalizes controller sentinels, enumerated values, units and optional divisors for display. */
function normalizeReading(sensor: BoilerSensor): RealtimeReading {
	const messages = getMessages();
	const rawValue = sensor.value;
	const formatTexts = sensor.formatTexts;
	if (formatTexts !== undefined && formatTexts !== null && typeof formatTexts !== 'string') {
		throw new BoilerError('response', messages.boilerResponseInvalid);
	}
	if (typeof formatTexts === 'string' && formatTexts !== '') {
		if (rawValue === '???' || rawValue === null || rawValue === undefined) return { value: null, unit: '' };
		const index = Number(rawValue);
		const options = formatTexts.split('|');
		if (!Number.isSafeInteger(index) || index < 0 || options[index] === undefined) {
			throw new BoilerError('response', messages.boilerResponseInvalid);
		}
		return { value: options[index], unit: '' };
	}

	if (rawValue === '???' || rawValue === 'null' || rawValue === null || rawValue === undefined || rawValue === '') {
		return { value: null, unit: '' };
	}
	if (typeof rawValue !== 'number' && typeof rawValue !== 'string') {
		throw new BoilerError('response', messages.boilerResponseInvalid);
	}
	const unitText = sensor.unitText;
	if (unitText !== undefined && unitText !== null && typeof unitText !== 'string') {
		throw new BoilerError('response', messages.boilerResponseInvalid);
	}
	const unit = unitText === 'K' ? '°C' : unitText === '???' ? '' : unitText ?? '';
	let value = Number(rawValue);
	if (!Number.isFinite(value)) {
		if (sensor.name === 'CAPPL:LOCAL.touch[0].version' && typeof rawValue === 'string') {
			return { value: rawValue, unit };
		}
		throw new BoilerError('response', `${messages.boilerResponseInvalid} Capteur non numérique : ${sensor.name}`);
	}

	const divisor = sensor.divisor;
	if (divisor !== undefined && divisor !== null && divisor !== '' && divisor !== '???') {
		if (typeof divisor !== 'number' && typeof divisor !== 'string') {
			throw new BoilerError('response', messages.boilerResponseInvalid);
		}
		const numericDivisor = Number(divisor);
		if (!Number.isFinite(numericDivisor) || numericDivisor === 0) {
			throw new BoilerError('response', messages.boilerResponseInvalid);
		}
		value /= numericDivisor;
	}
	if (!Number.isFinite(value)) throw new BoilerError('response', messages.boilerResponseInvalid);

	return { value, unit };
}

function parseReadings(value: unknown, circuit: number): RealtimeData {
	if (!Array.isArray(value)) throw boilerError('response');
	const expectedNames = realtimeSensorNames(circuit);
	const expected = new Set(expectedNames);
	const sensors = new Map<string, BoilerSensor>();
	for (const item of value) {
		if (!isRecord(item) || typeof item.name !== 'string' || !expected.has(item.name)) continue;
		if (sensors.has(item.name)) throw boilerError('response');
		sensors.set(item.name, item);
	}
	if (sensors.size === 0) throw boilerError('response');

	const readings: Record<string, RealtimeReading> = {};
	for (const indicator of realtimeIndicators) {
		const name = indicator.sensorName(circuit);
		const sensor = sensors.get(name);
		readings[indicator.id] = sensor ? normalizeReading(sensor) : { value: null, unit: '' };
	}
	return { circuit, updatedAt: Date.now(), readings };
}

async function parseResponse(response: Response, circuit: number): Promise<RealtimeData> {
	try {
		return parseReadings(await response.json(), circuit);
	} catch (cause) {
		if (cause instanceof BoilerError) throw cause;
		throw new BoilerError('response', getMessages().boilerResponseInvalid, cause);
	}
}

async function serialize<T>(operation: () => Promise<T>, queue: { current: Promise<void> }): Promise<T> {
	const previous = queue.current;
	let release = () => {};
	queue.current = new Promise<void>((resolve) => {
		release = resolve;
	});
	await previous;
	try {
		return await operation();
	} finally {
		release();
	}
}

export function createBoilerConnector(fetcher: typeof fetch = fetch) {
	let cookie = '';
	let sessionIdentity = '';
	const queue = { current: Promise.resolve() };

	async function request(url: URL, init: RequestInit): Promise<Response> {
		try {
			return await fetcher(url, { ...init, redirect: 'manual', signal: AbortSignal.timeout(5000) });
		} catch (cause) {
			throw new BoilerError('connection', getMessages().boilerConnectionFailed, cause);
		}
	}

	async function connect(address: URL, credentials: BoilerCredentials): Promise<string> {
		const response = await request(new URL('/index.cgi', address), {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'user-agent': 'Okovision Agent'
			},
			body: new URLSearchParams({
				username: credentials.username,
				password: credentials.password,
				language: 'en',
				submit: 'Login'
			})
		});
		const cookies = response.headers.getSetCookie()
			.map((setCookie) => setCookie.split(';', 1)[0])
			.filter(Boolean);
		if (response.status !== 303 || cookies.length === 0) throw boilerError('connection');
		return cookies.join('; ');
	}

	async function read(address: URL, cookieHeader: string, circuit: number): Promise<Response> {
		const sensorNames = ['CAPPL:LOCAL.L_fernwartung_datum_zeit_sek', ...realtimeSensorNames(circuit)];
		return request(new URL('/index.cgi?action=get&attr=1', address), {
			method: 'POST',
			headers: {
				accept: 'application/json',
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'accept-language': 'en',
				cookie: cookieHeader
			},
			body: JSON.stringify(sensorNames)
		});
	}

	return {
		/** Serializes access to the controller's shared login cookie and reconnects after stale sessions. */
		async getIndicators(
			addressValue: string,
			credentials: BoilerCredentials,
			circuit: number
		): Promise<RealtimeData> {
			if (!Number.isSafeInteger(circuit) || circuit < 1) throw boilerError('configuration');
			const address = new URL(addressValue);
			const identity = `${address.origin}\n${credentials.username}`;
			return serialize(async () => {
				if (sessionIdentity !== identity) {
					cookie = '';
					sessionIdentity = identity;
				}
				let response: Response | undefined;
				if (cookie) {
					response = await read(address, cookie, circuit);
					if (response.status === 200) {
						try {
							return await parseResponse(response, circuit);
						} catch (cause) {
							if (!(cause instanceof BoilerError) || cause.code !== 'response') throw cause;
						}
					}
					cookie = '';
				}
				if (!cookie) {
					cookie = await connect(address, credentials);
					response = await read(address, cookie, circuit);
				}
				if (!response) throw boilerError('connection');
				if (response.status !== 200) {
					cookie = '';
					throw boilerError('connection');
				}
				return parseResponse(response, circuit);
			}, queue);
		}
	};
}

let connector: ReturnType<typeof createBoilerConnector> | undefined;

/** Uses the standard controller account and reuses the process-wide connector. */
export async function getBoilerIndicators(circuit: number): Promise<RealtimeData> {
	let address: string;
	try {
		address = await readBoilerAddress();
	} catch (cause) {
		throw new BoilerError('configuration', getMessages().boilerConfigInvalid, cause);
	}

	connector ??= createBoilerConnector();
	return connector.getIndicators(address, { username: 'oekofen', password: 'oekofen' }, circuit);
}
