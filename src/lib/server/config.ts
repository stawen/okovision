import { readFile } from 'node:fs/promises';
import { getMessages } from './messages.ts';

export interface InstallationConfig {
	poidsPellet: number;
	timezone: string;
	ashtray: number | null;
}

export interface HistorySettings {
	surfaceMaison: number | null;
	hasSilo: boolean | null;
	siloSize: number | null;
}

async function readConfigFile(): Promise<unknown> {
	const contents = await readFile('config.json', 'utf8');
	return JSON.parse(contents) as unknown;
}

function configurationObject(value: unknown): Record<string, unknown> {
	const messages = getMessages();
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(messages.invalidInstallationConfig);
	}
	const config = value as Record<string, unknown>;
	const invalidKeys = Object.keys(config).filter((key) => key.includes('_'));
	if (invalidKeys.length > 0) throw new Error(messages.invalidConfigKeys(invalidKeys.join(', ')));
	return config;
}

export function parseBoilerAddress(value: unknown): string {
	const messages = getMessages();
	const rawAddress = configurationObject(value).chaudiere;
	if (typeof rawAddress !== 'string' || !rawAddress.trim() || /[/\\?#@]/.test(rawAddress)) {
		throw new Error(messages.boilerAddressInvalid);
	}
	let address: URL;
	try {
		address = new URL(`http://${rawAddress.trim()}`);
	} catch (cause) {
		if (cause instanceof TypeError) throw new Error(messages.boilerAddressInvalid, { cause });
		throw cause;
	}
	if (!address.hostname || address.username || address.password || address.pathname !== '/'
		|| address.search || address.hash) {
		throw new Error(messages.boilerAddressInvalid);
	}
	return address.origin;
}

export function parseInstallationConfig(value: unknown): InstallationConfig {
	const messages = getMessages();
	const config = configurationObject(value);
	const rawWeight = config.poidsPellet;
	const poidsPellet =
		typeof rawWeight === 'number' || (typeof rawWeight === 'string' && rawWeight.trim() !== '')
			? Number(rawWeight)
			: NaN;
	if (!Number.isFinite(poidsPellet) || poidsPellet <= 0) {
		throw new Error(messages.invalidPelletWeight);
	}
	const rawAshtray = config.ashtray;
	const ashtray = rawAshtray === undefined || rawAshtray === null || rawAshtray === ''
		? null
		: typeof rawAshtray === 'number' || (typeof rawAshtray === 'string' && rawAshtray.trim() !== '')
			? Number(rawAshtray)
			: NaN;
	if (ashtray !== null && (!Number.isFinite(ashtray) || ashtray <= 0)) {
		throw new Error(messages.invalidAshtray);
	}
	if (typeof config.timezone !== 'string' || !config.timezone) {
		throw new Error(messages.invalidTimezone);
	}
	try {
		new Intl.DateTimeFormat('fr-FR', { timeZone: config.timezone });
	} catch (error) {
		if (error instanceof RangeError) throw new Error(messages.invalidTimezone, { cause: error });
		throw error;
	}
	return { poidsPellet, timezone: config.timezone, ashtray };
}

export function parseHistorySettings(value: unknown): HistorySettings {
	const messages = getMessages();
	const config = configurationObject(value);
	const rawSurface = config.surfaceMaison;
	const surfaceMaison = rawSurface === undefined || rawSurface === null || rawSurface === ''
		|| rawSurface === 0 || rawSurface === '0'
		? null
		: typeof rawSurface === 'number' || (typeof rawSurface === 'string' && rawSurface.trim() !== '')
			? Number(rawSurface)
			: NaN;
	if (surfaceMaison !== null && (!Number.isFinite(surfaceMaison) || surfaceMaison <= 0)) {
		throw new Error(messages.invalidSurface);
	}
	const rawHasSilo = config.hasSilo;
	const hasSilo = rawHasSilo === undefined || rawHasSilo === null || rawHasSilo === ''
		? null
		: rawHasSilo === 1 || rawHasSilo === '1' || rawHasSilo === true
			? true
			: rawHasSilo === 0 || rawHasSilo === '0' || rawHasSilo === false
				? false
				: undefined;
	if (hasSilo === undefined) throw new Error(messages.invalidSilo);
	const rawSiloSize = config.siloSize;
	const siloSize = rawSiloSize === undefined || rawSiloSize === null || rawSiloSize === ''
		|| rawSiloSize === 0 || rawSiloSize === '0'
		? null
		: typeof rawSiloSize === 'number' || (typeof rawSiloSize === 'string' && rawSiloSize.trim() !== '')
			? Number(rawSiloSize)
			: NaN;
	if (siloSize !== null && (!Number.isFinite(siloSize) || siloSize <= 0)) {
		throw new Error(messages.invalidSiloSize);
	}
	return { surfaceMaison, hasSilo, siloSize };
}

export async function readInstallationConfig(): Promise<InstallationConfig> {
	return parseInstallationConfig(await readConfigFile());
}

export async function readHistoryConfig(): Promise<{ installation: InstallationConfig; settings: HistorySettings }> {
	const value = await readConfigFile();
	return { installation: parseInstallationConfig(value), settings: parseHistorySettings(value) };
}

export async function readBoilerAddress(): Promise<string> {
	return parseBoilerAddress(await readConfigFile());
}
