import { fail } from '@sveltejs/kit';
import { uiMessages } from '#lib/i18n.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { logger } from '#lib/server/logger.js';
import { SiloEventError, type SiloEventErrorCode, type SiloEventInput } from '#lib/server/repositories/silo-events.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'silo-events' });

function eventErrorMessage(code: SiloEventErrorCode, text: ReturnType<typeof uiMessages>): string {
	switch (code) {
		case 'invalid-input': return text.maintenanceEventsErrorInvalidInput;
		case 'event-not-found': return text.maintenanceEventsErrorNotFound;
	}
}

function formText(form: FormData, key: string): string {
	const value = form.get(key);
	if (typeof value !== 'string') throw new SiloEventError('invalid-input');
	return value;
}

function formId(form: FormData, key: string): number {
	const value = formText(form, key);
	if (!/^[1-9]\d*$/.test(value)) throw new SiloEventError('invalid-input');
	const id = Number(value);
	if (!Number.isSafeInteger(id)) throw new SiloEventError('invalid-input');
	return id;
}

function eventInput(form: FormData): SiloEventInput {
	return {
		eventDate: formText(form, 'eventDate'),
		eventType: formText(form, 'eventType'),
		quantity: form.get('quantity') === null ? '0' : formText(form, 'quantity'),
		remaining: form.get('remaining') === null ? '0' : formText(form, 'remaining'),
		price: form.get('price') === null ? '0' : formText(form, 'price')
	};
}

async function eventsPageData(language: Parameters<typeof uiMessages>[0]) {
	return {
		language,
		events: await getDataAccess().siloEvents.getEvents(),
		databaseError: false
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	try {
		return await eventsPageData(locals.language);
	} catch (cause) {
		log.error('siloEventsFailed', cause);
		return {
			language: locals.language,
			events: [],
			databaseError: true
		};
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		const form = await request.formData();
		let operation = 'unknown';

		try {
			operation = formText(form, 'operation');
			const events = getDataAccess().siloEvents;
			switch (operation) {
				case 'create-event':
					await events.createEvent(eventInput(form));
					break;
				case 'update-event':
					await events.updateEvent(formId(form, 'eventId'), eventInput(form));
					break;
				case 'delete-event':
					await events.deleteEvent(formId(form, 'eventId'));
					break;
				default:
					throw new SiloEventError('invalid-input');
			}
			return await eventsPageData(locals.language);
		} catch (cause) {
			if (cause instanceof SiloEventError) {
				return fail(400, { error: eventErrorMessage(cause.code, text) });
			}
			log.error('siloEventsFailed', cause, { operation });
			return fail(500, { error: text.maintenanceEventsWriteFailed });
		}
	}
};
