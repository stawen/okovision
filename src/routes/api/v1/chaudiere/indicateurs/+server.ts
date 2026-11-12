import { uiMessages } from '#lib/i18n.js';
import { boilerErrorCode, getBoilerIndicators } from '#lib/server/boiler.js';
import { logger } from '#lib/server/logger.js';
import type { RequestHandler } from './$types';

const log = logger.child({ component: 'boiler-indicators' });
const noStore = { headers: { 'cache-control': 'no-store' } };

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.member) return Response.json({ error: 'unauthorized' }, { ...noStore, status: 401 });
	const messages = uiMessages(locals.language);
	const selectedCircuits = url.searchParams.getAll('circuit');
	const rawCircuit = selectedCircuits[0] ?? '1';
	if (selectedCircuits.length > 1 || !/^\d+$/.test(rawCircuit)) {
		return Response.json(
			{ error: 'invalid-circuit', message: messages.invalidRealtimeCircuit },
			{ ...noStore, status: 400 }
		);
	}
	const circuit = Number(rawCircuit);
	if (!Number.isSafeInteger(circuit) || circuit < 1) {
		return Response.json(
			{ error: 'invalid-circuit', message: messages.invalidRealtimeCircuit },
			{ ...noStore, status: 400 }
		);
	}

	try {
		return Response.json(await getBoilerIndicators(circuit), noStore);
	} catch (cause) {
		const code = boilerErrorCode(cause);
		log.error('boilerReadFailed', cause, { circuit, failure: code });
		return Response.json({ error: code }, { ...noStore, status: 503 });
	}
};
