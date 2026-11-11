import { getMessages, type LogMessageKey } from './messages.ts';

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
	const entry = {
		...fields,
		timestamp: new Date().toISOString(),
		level,
		component: context.component,
		event,
		message: getMessages()[event],
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
