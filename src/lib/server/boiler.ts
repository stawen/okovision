import { getMessages } from './messages.ts';
import { readBoilerAddress } from './config.ts';
import { getDataAccess } from './data-access.ts';
import type { BoilerCredentials } from './repositories/users.ts';
import {
	realtimeIndicators,
	realtimeSensorNames,
	editableRealtimeIndicators,
	legacySensorId,
	type RealtimeData,
	type RealtimeReading
} from '../indicators/realtime.ts';

export type BoilerErrorCode = 'configuration' | 'credentials' | 'database' | 'connection' | 'response' | 'unavailable' | 'invalid' | 'conflict' | 'uncertain';

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
	lowerLimit?: unknown;
	upperLimit?: unknown;
}

export interface EditableBoilerSensor {
	value: number;
	unit: string;
	min: number;
	max: number;
	divisor: number;
}

export function validateEditableBoilerValue(sensor: EditableBoilerSensor, value: number): void {
	const raw = value * sensor.divisor;
	if (!Number.isFinite(value) || value < sensor.min || value > sensor.max || !Number.isSafeInteger(Math.round(raw))
		|| Math.abs(raw - Math.round(raw)) > 1e-8) throw boilerError('invalid');
}

function editableSensor(sensor: BoilerSensor): EditableBoilerSensor {
	const reading = normalizeReading(sensor);
	function numeric(value: unknown): number {
		if ((typeof value !== 'number' && typeof value !== 'string')
			|| (typeof value === 'string' && !/^-?\d+(?:\.\d+)?$/.test(value))) throw boilerError('response');
		const result = Number(value);
		if (!Number.isFinite(result)) throw boilerError('response');
		return result;
	}
	const divisor = numeric(sensor.divisor);
	const lower = numeric(sensor.lowerLimit);
	const upper = numeric(sensor.upperLimit);
	if (typeof reading.value !== 'number' || divisor <= 0 || lower > upper) {
		throw boilerError('response');
	}
	return { value: reading.value, unit: reading.unit, min: lower / divisor, max: upper / divisor, divisor };
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

	async function readNames(address: URL, cookieHeader: string, names: string[]): Promise<Response> {
		const sensorNames = ['CAPPL:LOCAL.L_fernwartung_datum_zeit_sek', ...names];
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

	async function readEditable(address: URL, credentials: BoilerCredentials, ids: string[]): Promise<Record<string, EditableBoilerSensor>> {
		const definitions = ids.map((id) => {
			const definition = editableRealtimeIndicators.find((indicator) => legacySensorId(indicator) === id);
			if (!definition) throw boilerError('invalid');
			return definition;
		});
		const identity = `${address.origin}\n${credentials.username}`;
		if (identity !== sessionIdentity) {
			cookie = '';
			sessionIdentity = identity;
		}
		const names = definitions.map((definition) => definition.sensorName(1));
		async function attempt(): Promise<Record<string, EditableBoilerSensor>> {
			const response = await readNames(address, cookie, names);
			if (response.status !== 200) throw boilerError('connection');
			let value: unknown;
			try {
				value = await response.json();
			} catch (cause) {
				throw new BoilerError('response', getMessages().boilerResponseInvalid, cause);
			}
			if (!Array.isArray(value)) throw boilerError('response');
			const result: Record<string, EditableBoilerSensor> = {};
			for (const definition of definitions) {
				const matches = value.filter((item: unknown) => isRecord(item) && item.name === definition.sensorName(1));
				if (matches.length !== 1 || !isRecord(matches[0])) throw boilerError('response');
				result[legacySensorId(definition)] = editableSensor(matches[0]);
			}
			return result;
		}
		if (cookie) {
			try {
				return await attempt();
			} catch (cause) {
				if (!(cause instanceof BoilerError) || (cause.code !== 'connection' && cause.code !== 'response')) throw cause;
				cookie = '';
			}
		}
		cookie = await connect(address, credentials);
		return attempt();
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
					response = await readNames(address, cookie, realtimeSensorNames(circuit));
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
					response = await readNames(address, cookie, realtimeSensorNames(circuit));
				}
				if (!response) throw boilerError('connection');
				if (response.status !== 200) {
					cookie = '';
					throw boilerError('connection');
				}
				return parseResponse(response, circuit);
			}, queue);
		},
		async getEditableSensor(addressValue: string, credentials: BoilerCredentials, id: string): Promise<EditableBoilerSensor> {
			return serialize(async () => (await readEditable(new URL(addressValue), credentials, [id]))[id], queue);
		},
		async applyConfiguration(
			addressValue: string,
			credentials: BoilerCredentials,
			changes: Record<string, { value: number; previous: number }>
		): Promise<void> {
			const ids = Object.keys(changes);
			if (ids.length === 0 || ids.length > editableRealtimeIndicators.length) throw boilerError('invalid');
			return serialize(async () => {
				const address = new URL(addressValue);
				const current = await readEditable(address, credentials, ids);
				const payload: Record<string, number> = {};
				for (const id of ids) {
					const sensor = current[id];
					const change = changes[id];
					if (!sensor || !Number.isFinite(change.value) || !Number.isFinite(change.previous)) throw boilerError('invalid');
					if (sensor.value !== change.previous) throw boilerError('conflict');
					if (change.value === change.previous) throw boilerError('invalid');
					validateEditableBoilerValue(sensor, change.value);
					const definition = editableRealtimeIndicators.find((indicator) => legacySensorId(indicator) === id);
					if (!definition) throw boilerError('invalid');
					payload[definition.sensorName(1)] = Math.round(change.value * sensor.divisor);
				}
				let sendFailed: boolean;
				try {
					const response = await request(new URL('/index.cgi?action=set', address), {
						method: 'POST',
						headers: {
							accept: 'application/json',
							'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
							'accept-language': 'en',
							cookie
						},
						body: JSON.stringify(payload)
					});
					sendFailed = response.status !== 200;
				} catch (cause) {
					if (!(cause instanceof BoilerError) || cause.code !== 'connection') throw cause;
					sendFailed = true;
				}
				try {
					const verified = await readEditable(address, credentials, ids);
					if (ids.every((id) => verified[id].value === changes[id].value)) return;
				} catch (cause) {
					throw new BoilerError('uncertain', getMessages().boilerResponseInvalid, cause);
				}
				throw new BoilerError('uncertain', sendFailed ? getMessages().boilerConnectionFailed : getMessages().boilerResponseInvalid);
			}, queue);
		}
	};
}

let connector: ReturnType<typeof createBoilerConnector> | undefined;

/** Uses the stored controller credentials and reuses the process-wide connector. */
async function boilerConnection(): Promise<{ address: string; credentials: BoilerCredentials }> {
	let address: string;
	try {
		address = await readBoilerAddress();
	} catch (cause) {
		throw new BoilerError('configuration', getMessages().boilerConfigInvalid, cause);
	}

	let credentials: BoilerCredentials | null;
	try {
		credentials = await getDataAccess().users.getAdminBoilerCredentials();
	} catch (cause) {
		throw new BoilerError('database', getMessages().boilerCredentialsLoadFailed, cause);
	}
	if (!credentials) throw boilerError('credentials');

	return { address, credentials };
}

export async function getBoilerIndicators(circuit: number): Promise<RealtimeData> {
	const { address, credentials } = await boilerConnection();
	connector ??= createBoilerConnector();
	return connector.getIndicators(address, credentials, circuit);
}

export async function getEditableBoilerSensor(id: string): Promise<EditableBoilerSensor> {
	const { address, credentials } = await boilerConnection();
	connector ??= createBoilerConnector();
	return connector.getEditableSensor(address, credentials, id);
}

export async function applyBoilerConfiguration(changes: Record<string, { value: number; previous: number }>): Promise<void> {
	const { address, credentials } = await boilerConnection();
	connector ??= createBoilerConnector();
	return connector.applyConfiguration(address, credentials, changes);
}
