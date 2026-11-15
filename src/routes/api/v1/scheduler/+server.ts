import { dev } from '$app/env';
import { json } from '@sveltejs/kit';
import { getJobManager } from '#lib/server/jobs.js';
import { logger } from '#lib/server/logger.js';
import type { RequestHandler } from './$types';

const log = logger.child({ component: 'scheduler-api' });
const noStore = { headers: { 'cache-control': 'no-store' } };

export const POST: RequestHandler = async ({ request, url, locals }) => {
	if (!dev) return json({ error: 'not-found' }, { ...noStore, status: 404 });
	if (!locals.member) return json({ error: 'unauthorized' }, { ...noStore, status: 401 });
	if (locals.member.type !== 'admin') return json({ error: 'forbidden' }, { ...noStore, status: 403 });
	if (request.headers.get('origin') !== url.origin) {
		return json({ error: 'invalid-origin' }, { ...noStore, status: 403 });
	}

	try {
		const job = await (await getJobManager(false)).enqueueCollection(String(locals.member.id));
		return json(job, { ...noStore, status: 202 });
	} catch (cause) {
		log.error('collectionFailed', cause, { operation: 'manual', memberId: locals.member.id });
		return json({ error: 'unavailable' }, { ...noStore, status: 503 });
	}
};
