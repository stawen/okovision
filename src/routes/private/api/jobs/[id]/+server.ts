import { error, json } from '@sveltejs/kit';
import { getJobManager } from '#lib/server/jobs.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.member) error(401);
	const job = (await getJobManager()).get(params.id);
	if (!job) error(404);
	return json(job, { headers: { 'cache-control': 'no-store' } });
};
