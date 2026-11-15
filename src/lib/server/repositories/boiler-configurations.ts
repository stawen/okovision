import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { completeBoilerConfiguration, parseBoilerConfiguration, type BoilerConfiguration } from '../../boiler-configurations.js';

interface ConfigurationRow extends RowDataPacket {
	timestamp: number;
	description: string;
	config: string;
}

export interface SavedBoilerConfiguration {
	timestamp: number;
	description: string;
}

export class BoilerConfigurationError extends Error {
	constructor(readonly code: 'invalid' | 'not-found' | 'conflict', options?: ErrorOptions) {
		super(code, options);
	}
}

function requireTimestamp(value: number): number {
	if (!Number.isSafeInteger(value) || value <= 0 || value > 4_294_967_295) {
		throw new BoilerConfigurationError('invalid');
	}
	return value;
}

export function legacyWallTimestamp(date: string): number {
	if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d)?$/.test(date)) throw new BoilerConfigurationError('invalid');
	const normalized = date.length === 16 ? `${date}:00` : date;
	const timestamp = Date.parse(`${normalized}Z`);
	if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 19) !== normalized) {
		throw new BoilerConfigurationError('invalid');
	}
	return requireTimestamp(timestamp / 1000);
}

export function currentLegacyTimestamp(timezone: string, now = new Date()): number {
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
	}).formatToParts(now);
	const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
	return legacyWallTimestamp(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`);
}

export function createBoilerConfigurationsRepository(db: Pick<Pool, 'execute'>) {
	return {
		async list(): Promise<SavedBoilerConfiguration[]> {
			const [rows] = await db.execute<ConfigurationRow[]>(
				'SELECT timestamp, description FROM oko_boiler ORDER BY timestamp DESC'
			);
			return rows.map((row) => ({ timestamp: requireTimestamp(Number(row.timestamp)), description: row.description }));
		},
		async get(timestamp: number): Promise<BoilerConfiguration> {
			const [rows] = await db.execute<ConfigurationRow[]>(
				'SELECT config FROM oko_boiler WHERE timestamp = ?', [requireTimestamp(timestamp)]
			);
			if (!rows[0]) throw new BoilerConfigurationError('not-found');
			return parseBoilerConfiguration(JSON.parse(rows[0].config));
		},
		async save(timestamp: number, description: string, config: unknown): Promise<void> {
			requireTimestamp(timestamp);
			if (!description.trim() || description.length > 50) throw new BoilerConfigurationError('invalid');
			let values: BoilerConfiguration;
			try {
				values = completeBoilerConfiguration(config);
			} catch (cause) {
				throw new BoilerConfigurationError('invalid', { cause });
			}
			try {
				await db.execute('INSERT INTO oko_boiler (timestamp, description, config) VALUES (?, ?, ?)',
					[timestamp, description.trim(), JSON.stringify(values)]);
			} catch (cause) {
				if (cause instanceof Error && 'code' in cause && cause.code === 'ER_DUP_ENTRY') {
					throw new BoilerConfigurationError('conflict');
				}
				throw cause;
			}
		},
		async delete(timestamp: number): Promise<void> {
			const [result] = await db.execute<ResultSetHeader>(
				'DELETE FROM oko_boiler WHERE timestamp = ?', [requireTimestamp(timestamp)]
			);
			if (!result.affectedRows) throw new BoilerConfigurationError('not-found');
		}
	};
}
