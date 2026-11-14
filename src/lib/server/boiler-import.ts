import { readBoilerAddress } from './config.ts';
import { BoilerImportError } from './boiler-import-error.ts';
import { boilerCsvDirectory } from '../boiler-address.ts';

const directoryPath = boilerCsvDirectory;
const listingLimit = 1024 * 1024;
const csvLimit = 16 * 1024 * 1024;
const filenamePattern = /^touch_(\d{4})(\d{2})(\d{2})\.csv$/;
const supportedCharsets = new Set(['utf-8', 'utf8', 'windows-1252', 'iso-8859-1', 'latin1']);

export interface BoilerCsvFile {
	name: string;
	url: string;
}

export function isBoilerCsvFilename(value: string): boolean {
	const match = filenamePattern.exec(value);
	if (!match) return false;
	const [, year, month, day] = match;
	const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
	return date.getUTCFullYear() === Number(year)
		&& date.getUTCMonth() === Number(month) - 1
		&& date.getUTCDate() === Number(day);
}

export function boilerCsvDay(filename: string): string {
	if (!isBoilerCsvFilename(filename)) throw new BoilerImportError('response');
	return `${filename.slice(6, 10)}-${filename.slice(10, 12)}-${filename.slice(12, 14)}`;
}

/** Enforces the byte limit while streaming and decodes only the controller's supported CSV charsets. */
async function responseText(response: Response, maxBytes: number): Promise<string> {
	const length = response.headers.get('content-length');
	if (length && Number(length) > maxBytes) throw new BoilerImportError('response');
	if (!response.body) return '';

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let size = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > maxBytes) throw new BoilerImportError('response');
			chunks.push(value);
		}
	} catch (cause) {
		await reader.cancel();
		if (cause instanceof BoilerImportError) throw cause;
		throw new BoilerImportError('connection', cause);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	const contentType = response.headers.get('content-type') ?? '';
	const charset = /charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType)?.[1]?.toLowerCase();
	if (charset && !supportedCharsets.has(charset)) throw new BoilerImportError('response');
	try {
		return new TextDecoder(charset ?? 'utf-8', { fatal: true }).decode(bytes);
	} catch (cause) {
		if (!charset || charset === 'utf-8' || charset === 'utf8') {
			try {
				return new TextDecoder('windows-1252', { fatal: true }).decode(bytes);
			} catch {
				throw new BoilerImportError('response', cause);
			}
		}
		throw new BoilerImportError('response', cause);
	}
}

function anchorHrefs(html: string): string[] {
	const links: string[] = [];
	const anchor = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
	for (const match of html.matchAll(anchor)) {
		links.push(match[1] ?? match[2] ?? match[3] ?? '');
	}
	return links;
}

export function createBoilerCsvConnector(fetcher: typeof fetch = fetch) {
	async function getText(url: URL, maxBytes: number, signal?: AbortSignal): Promise<string> {
		let response: Response;
		try {
			response = await fetcher(url, {
				headers: { accept: 'text/html,text/csv;q=0.9,*/*;q=0.8' },
				redirect: 'error',
				cache: 'no-store',
				signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000)
			});
		} catch (cause) {
			throw new BoilerImportError('connection', cause);
		}
		if (response.status === 404) throw new BoilerImportError('file-not-found');
		if (response.status !== 200) throw new BoilerImportError('response');
		return responseText(response, maxBytes);
	}

	return {
		/** Keeps only valid CSV links from the controller's own logfile directory. */
		async getFiles(address: string, signal?: AbortSignal): Promise<BoilerCsvFile[]> {
			const origin = new URL(address).origin;
			const directory = new URL(directoryPath, origin);
			const html = await getText(directory, listingLimit, signal);
			const files = new Map<string, BoilerCsvFile>();
			for (const href of anchorHrefs(html)) {
				try {
					const linkedUrl = new URL(href, directory);
					if (linkedUrl.origin !== directory.origin || linkedUrl.search || linkedUrl.hash
						|| linkedUrl.username || linkedUrl.password
						|| linkedUrl.pathname !== `${directoryPath}${decodeURIComponent(linkedUrl.pathname.split('/').at(-1) ?? '')}`) {
						continue;
					}
					const name = decodeURIComponent(linkedUrl.pathname.split('/').at(-1) ?? '');
					if (!isBoilerCsvFilename(name)) continue;
					files.set(name, { name, url: new URL(name, directory).href });
				} catch (cause) {
					if (cause instanceof BoilerImportError) throw cause;
				}
			}
			return [...files.values()].sort((left, right) => left.name.localeCompare(right.name));
		},

		async importFile(address: string, filename: string, signal?: AbortSignal): Promise<string> {
			if (!isBoilerCsvFilename(filename)) throw new BoilerImportError('response');
			const origin = new URL(address).origin;
			const url = new URL(filename, new URL(directoryPath, origin));
			return getText(url, csvLimit, signal);
		}
	};
}

const connector = createBoilerCsvConnector();

async function getAddress(): Promise<string> {
	try {
		return await readBoilerAddress();
	} catch (cause) {
		throw new BoilerImportError('configuration', cause);
	}
}

export async function getBoilerCsvFiles(): Promise<BoilerCsvFile[]> {
	return connector.getFiles(await getAddress());
}
