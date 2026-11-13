import { error } from '@sveltejs/kit';
import { getJobManager } from '#lib/server/jobs.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.member) error(401);
	const job = (await getJobManager()).get(params.id);
	if (!job) error(404);
	return { job, language: locals.language };
};
