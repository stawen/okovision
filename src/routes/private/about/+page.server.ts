import { logger } from '#lib/server/logger.js';
import type { Language } from '#lib/ui/i18n.js';
import type { PageServerLoad } from './$types';
import packageJson from '../../../../package.json' with { type: 'json' };

const log = logger.child({ component: 'about' });
const updateFeedUrl = 'https://okovision.dronek.com/update.test.json';

type Release = {
	version: string;
	date: string | null;
	changelog: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function versionParts(value: string): number[] | null {
	if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) return null;
	const parts = value.split('.').map(Number);
	return parts.every(Number.isSafeInteger) ? parts : null;
}

function compareVersionsDescending(left: string, right: string): number {
	const leftParts = versionParts(left)!;
	const rightParts = versionParts(right)!;
	for (let index = 0; index < leftParts.length; index += 1) {
		if (leftParts[index] !== rightParts[index]) return rightParts[index] - leftParts[index];
	}
	return 0;
}

function decodeEntity(entity: string): string {
	const namedEntities: Record<string, string> = {
		amp: '&',
		apos: "'",
		gt: '>',
		lt: '<',
		nbsp: ' ',
		quot: '"'
	};
	if (entity in namedEntities) return namedEntities[entity];

	const numeric = entity.match(/^#(x[0-9a-f]+|\d+)$/i)?.[1];
	if (!numeric) return entity;
	const codePoint = numeric[0].toLowerCase() === 'x'
		? Number.parseInt(numeric.slice(1), 16)
		: Number.parseInt(numeric, 10);
	return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
		? String.fromCodePoint(codePoint)
		: '';
}

function changelogText(value: string): string {
	// The feed contains HTML, but the page renders plain text; strip markup before decoding entities.
	return value
		.slice(0, 20_000)
		.replace(/<\s*li(?:\s[^>]*)?>/gi, '\n• ')
		.replace(/<\s*\/\s*(?:li|ul)\s*>/gi, '\n')
		.replace(/<\s*br\s*\/?\s*>/gi, '\n')
		.replace(/<[^>]*>/g, '')
		.replace(/&(?:amp|apos|gt|lt|nbsp|quot|#(?:x[0-9a-f]+|\d+));/gi, (entity) => decodeEntity(entity.slice(1, -1)))
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function parseReleases(payload: unknown): Release[] {
	if (!isRecord(payload)) throw new Error('Invalid update feed payload');

	const releases = Object.entries(payload).flatMap(([version, value]) => {
		if (!versionParts(version) || !isRecord(value) || typeof value.changelog !== 'string') return [];
		return [{
			version,
			date: typeof value.date === 'string' && value.date.length <= 40 ? value.date : null,
			changelog: changelogText(value.changelog)
		}];
	});

	if (releases.length === 0) throw new Error('Update feed contains no valid releases');
	return releases.sort((left, right) => compareVersionsDescending(left.version, right.version));
}

export async function _loadAboutData(fetcher: typeof fetch, language: Language) {
	try {
		const response = await fetcher(updateFeedUrl, {
			headers: { accept: 'application/json' },
			redirect: 'error',
			cache: 'no-store',
			signal: AbortSignal.timeout(5000)
		});
		if (!response.ok) throw new Error(`Update feed returned HTTP ${response.status}`);

		return {
			language,
			applicationVersion: packageJson.version,
			releases: parseReleases(await response.json()),
			updateFeedError: false
		};
	} catch (cause) {
		log.error('updateFeedFailed', cause);
		return {
			language,
			applicationVersion: packageJson.version,
			releases: [],
			updateFeedError: true
		};
	}
}

export const load: PageServerLoad = ({ fetch, locals }) => {
	return _loadAboutData(fetch, locals.language);
};
