import { getMessages, type LogMessageKey } from './messages.ts';
import { InvalidLanguageError } from './language.ts';

type LogContext = Readonly<{ component: string }>;
type LogFields = Readonly<Record<string, unknown>>;

function serializeCause(cause: unknown) {
	if (cause instanceof Error) {
		return {
			type: cause.name,
			message: cause.message,
			...(cause.stack ? { stack: cause.stack } : {})
		};
	}
	return { message: String(cause) };
}

function write(
	level: 'info' | 'error',
	context: LogContext,
	event: LogMessageKey,
	fields: LogFields,
	cause?: unknown
): void {
	let message: string;
	try {
		message = getMessages()[event];
	} catch (error) {
		// Logging must still work when the configured UI language is invalid.
		if (!(error instanceof InvalidLanguageError)) throw error;
		console.error(JSON.stringify({
			...fields,
			timestamp: new Date().toISOString(),
			level: 'error',
			component: context.component,
			event,
			message: error.message,
			...(level === 'error' ? { err: serializeCause(cause) } : {})
		}));
		return;
	}
	const entry = {
		...fields,
		timestamp: new Date().toISOString(),
		level,
		component: context.component,
		event,
		message,
		...(level === 'error' ? { err: serializeCause(cause) } : {})
	};
	console[level](JSON.stringify(entry));
}

export const logger = {
	child(context: LogContext) {
		return {
			info(event: LogMessageKey, fields: LogFields = {}): void {
				write('info', context, event, fields);
			},
			error(event: LogMessageKey, cause: unknown, fields: LogFields = {}): void {
				write('error', context, event, fields, cause);
			}
		};
	}
};
