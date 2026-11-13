import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { uiMessages } from '#lib/ui/i18n.js';
import { getDataAccess } from '#lib/server/data-access.js';
import { DailyReportError, type DailyReportErrorCode } from '#lib/server/repositories/daily-reports.js';
import { logger } from '#lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types';

const log = logger.child({ component: 'daily-reports' });

function reportErrorMessage(code: DailyReportErrorCode, text: ReturnType<typeof uiMessages>): string {
	switch (code) {
		case 'invalid-input': return text.dailyReportsErrorInvalidInput;
		case 'duplicate-graph': return text.dailyReportsErrorDuplicateGraph;
		case 'graph-not-found': return text.dailyReportsErrorGraphNotFound;
		case 'sensor-not-found': return text.dailyReportsErrorSensorNotFound;
		case 'duplicate-association': return text.dailyReportsErrorDuplicateAssociation;
		case 'association-not-found': return text.dailyReportsErrorAssociationNotFound;
		case 'invalid-coefficient': return text.dailyReportsErrorInvalidCoefficient;
	}
}

function formText(form: FormData, key: string): string {
	const value = form.get(key);
	if (typeof value !== 'string') throw new DailyReportError('invalid-input');
	return value;
}

function formId(form: FormData, key: string): number {
	const value = formText(form, key);
	if (!/^[1-9]\d*$/.test(value)) throw new DailyReportError('invalid-input');
	const id = Number(value);
	if (!Number.isSafeInteger(id)) throw new DailyReportError('invalid-input');
	return id;
}

function formSelectedGraphId(form: FormData): number | null {
	const value = form.get('selectedGraphId');
	if (value === null || value === '') return null;
	return formId(form, 'selectedGraphId');
}

async function reportsPageData(language: Parameters<typeof uiMessages>[0], selectedId: number | null = null) {
	const reports = getDataAccess().dailyReports;
	const [graphs, sensors] = await Promise.all([reports.getGraphs(), reports.getSensors()]);
	if (selectedId !== null && !graphs.some((graph) => graph.id === selectedId)) {
		throw new DailyReportError('invalid-input');
	}
	const selectedGraphId = selectedId ?? graphs[0]?.id ?? null;
	const associations = selectedGraphId === null ? [] : await reports.getAssociations(selectedGraphId);
	return {
		language,
		graphs,
		sensors,
		associations,
		selectedGraphId,
		databaseError: false
	};
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (url.search) redirect(303, resolve('/private/configuration/reports'));
	try {
		return await reportsPageData(locals.language);
	} catch (cause) {
		log.error('dailyReportsFailed', cause);
		return {
			language: locals.language,
			graphs: [],
			sensors: [],
			associations: [],
			selectedGraphId: null,
			databaseError: true
		};
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const text = uiMessages(locals.language);
		const form = await request.formData();
		let operation = 'unknown';
		let nextGraphId: number | null;

		try {
			nextGraphId = formSelectedGraphId(form);
			operation = formText(form, 'operation');
			const reports = getDataAccess().dailyReports;
			switch (operation) {
				case 'select-graph':
					if (nextGraphId === null) throw new DailyReportError('invalid-input');
					break;
				case 'create-graph':
					nextGraphId = await reports.createGraph(formText(form, 'name'));
					break;
				case 'rename-graph': {
					const graphId = formId(form, 'graphId');
					await reports.renameGraph(graphId, formText(form, 'name'));
					break;
				}
				case 'delete-graph': {
					const graphId = formId(form, 'graphId');
					await reports.deleteGraph(graphId);
					if (nextGraphId === graphId) nextGraphId = null;
					break;
				}
				case 'move-graph': {
					const graphId = formId(form, 'graphId');
					const direction = formText(form, 'direction');
					if (direction !== 'up' && direction !== 'down') {
						throw new DailyReportError('invalid-input');
					}
					await reports.moveGraph(graphId, direction);
					break;
				}
				case 'reorder-graph':
					await reports.reorderGraph(
						formId(form, 'graphId'),
						formId(form, 'targetGraphId'),
						formText(form, 'placement')
					);
					break;
				case 'add-association': {
					const graphId = formId(form, 'graphId');
					await reports.addAssociation(
						graphId,
						formId(form, 'sensorId'),
						formText(form, 'coefficient')
					);
					break;
				}
				case 'update-association': {
					const graphId = formId(form, 'graphId');
					await reports.updateAssociation(
						graphId,
						formId(form, 'sensorId'),
						formText(form, 'coefficient')
					);
					break;
				}
				case 'delete-association': {
					const graphId = formId(form, 'graphId');
					await reports.deleteAssociation(graphId, formId(form, 'sensorId'));
					break;
				}
				case 'move-association': {
					const graphId = formId(form, 'graphId');
					const direction = formText(form, 'direction');
					if (direction !== 'up' && direction !== 'down') {
						throw new DailyReportError('invalid-input');
					}
					await reports.moveAssociation(graphId, formId(form, 'sensorId'), direction);
					break;
				}
				case 'reorder-association':
					await reports.reorderAssociation(
						formId(form, 'graphId'),
						formId(form, 'sensorId'),
						formId(form, 'targetSensorId'),
						formText(form, 'placement')
					);
					break;
				default:
					throw new DailyReportError('invalid-input');
			}
			return await reportsPageData(locals.language, nextGraphId);
		} catch (cause) {
			if (cause instanceof DailyReportError) {
				const message = operation === 'select-graph' && cause.code === 'invalid-input'
					? text.dailyReportsInvalidSelection
					: reportErrorMessage(cause.code, text);
				return fail(400, { error: message });
			}
			log.error('dailyReportsFailed', cause, { operation });
			return fail(500, { error: text.dailyReportsWriteFailed });
		}
	}
};
