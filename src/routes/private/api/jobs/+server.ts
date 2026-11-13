import { error, json } from '@sveltejs/kit';
import { getJobManager } from '#lib/server/jobs.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.member) error(401);
	return json((await getJobManager()).list(), { headers: { 'cache-control': 'no-store' } });
};
