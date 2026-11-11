import { getMessages, type LogMessageKey } from './messages.ts';

type LogSource = { file: string; function: string };

function format(source: LogSource, key: LogMessageKey): string {
	return `[${source.file}:${source.function}] ${getMessages()[key]}`;
}

export const logger = {
	info(source: LogSource, key: LogMessageKey): void {
		console.info(format(source, key));
	},
	error(source: LogSource, key: LogMessageKey, cause: unknown): void {
		console.error(format(source, key), cause);
	}
};
