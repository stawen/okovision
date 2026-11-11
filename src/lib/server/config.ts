import { readFile } from 'node:fs/promises';
import { getMessages } from './messages.ts';

export interface InstallationConfig {
	poidsPellet: number;
	timezone: string;
}

export function parseInstallationConfig(value: unknown): InstallationConfig {
	const messages = getMessages();
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(messages.invalidInstallationConfig);
	}
	const config = value as Record<string, unknown>;
	const rawWeight = config.poids_pellet;
	const poidsPellet =
		typeof rawWeight === 'number' || (typeof rawWeight === 'string' && rawWeight.trim() !== '')
			? Number(rawWeight)
			: NaN;
	if (!Number.isFinite(poidsPellet) || poidsPellet <= 0) {
		throw new Error(messages.invalidPelletWeight);
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
	return { poidsPellet, timezone: config.timezone };
}

export async function readInstallationConfig(): Promise<InstallationConfig> {
	const contents = await readFile('config.json', 'utf8');
	return parseInstallationConfig(JSON.parse(contents));
}
