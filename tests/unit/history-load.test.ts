import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getYears: vi.fn(),
	getSeasons: vi.fn(),
	getMonthlyHistory: vi.fn(),
	getSeasonHistory: vi.fn(),
	getStockStatus: vi.fn(),
	readHistoryConfig: vi.fn(),
	logError: vi.fn()
}));
vi.mock('../../src/lib/server/data-access', () => ({
	getDataAccess: () => ({
		history: {
			getYears: mocks.getYears,
			getSeasons: mocks.getSeasons,
			getMonthlyHistory: mocks.getMonthlyHistory,
			getSeasonHistory: mocks.getSeasonHistory
		},
		maintenance: { getStockStatus: mocks.getStockStatus }
	})
}));
vi.mock('../../src/lib/server/config', () => ({
	readHistoryConfig: mocks.readHistoryConfig
}));
vi.mock('../../src/lib/server/logger', () => ({ logger: { child: () => ({ error: mocks.logError }) } }));

import { actions, load } from '../../src/routes/history/+page.server';

type LoadEvent = Parameters<typeof load>[0];
const selectHistory = actions.default;
if (!selectHistory) throw new Error('Missing history action');
type ActionEvent = Parameters<typeof selectHistory>[0];

function event(query = ''): LoadEvent {
	return {
		url: new URL(`http://localhost/history${query}`),
		locals: { language: 'fr', member: null }
	} as LoadEvent;
}

function selection(values: Record<string, string | undefined>): ActionEvent {
	const form = new FormData();
	for (const [name, value] of Object.entries(values)) {
		if (value !== undefined) form.set(name, value);
	}
	return {
		request: new Request('http://localhost/history', { method: 'POST', body: form }),
		locals: { language: 'fr', member: null }
	} as ActionEvent;
}

const seasons = [
	{ id: 1, name: '2024-2025', startDate: '2024-09-01', endDate: '2025-08-31' },
	{ id: 2, name: '2025-2026', startDate: '2025-09-01', endDate: '2026-08-31' }
];

describe('chargement de l’historique', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.readHistoryConfig.mockResolvedValue({
			installation: { timezone: 'Europe/Paris' },
			settings: { surfaceMaison: 150, hasSilo: true, siloSize: 4000 }
		});
		mocks.getYears.mockResolvedValue([2026, 2025]);
		mocks.getSeasons.mockResolvedValue(seasons);
		mocks.getMonthlyHistory.mockResolvedValue({ indicators: { sampleCount: 0 }, chart: {} });
		mocks.getSeasonHistory.mockResolvedValue({ season: seasons[1], months: [] });
		mocks.getStockStatus.mockResolvedValue({ status: 'unavailable' });
	});

	it('utilise les filtres demandés et conserve les deux périodes', async () => {
		const result = await selectHistory(selection({ month: '2', year: '2025', season: '2' }));
		expect(result).toMatchObject({ month: 2, year: 2025, selectedSeasonId: 2, databaseError: false });
		expect(mocks.getMonthlyHistory).toHaveBeenCalledWith(2, 2025);
		expect(mocks.getSeasonHistory).toHaveBeenCalledWith(seasons[1], 150);
		expect(mocks.getStockStatus).toHaveBeenCalledWith(true, 4000);
	});

	it('utilise la dernière année disponible si l’année courante est absente', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2027-10-12T12:00:00Z'));
		try {
			const result = await load(event());
			expect(result).toMatchObject({ month: 10, year: 2026, years: [2026, 2025] });
			expect(mocks.getMonthlyHistory).toHaveBeenCalledWith(10, 2026);
		} finally {
			vi.useRealTimers();
		}
	});

	it('ne fabrique aucune année si la base ne contient pas de synthèse', async () => {
		mocks.getYears.mockResolvedValue([]);
		const result = await selectHistory(selection({ month: '2', year: '2025' }));
		expect(result).toMatchObject({ year: 2025, years: [], databaseError: false });
	});

	it.each([
		{ month: '13', year: '2025' },
		{ month: '1', year: 'oops' },
		{ month: '1', year: '2037' },
		{ month: '1', year: '2025', season: '-1' },
		{ month: '1', year: '2025', season: '999' },
		{ month: '1', year: '2025', direction: '0' },
		{ month: '1', year: '2025', direction: '-1' }
	])(
		'refuse la sélection invalide %j',
		async (values) => {
			await expect(selectHistory(selection(values))).rejects.toMatchObject({ status: 400 });
			expect(mocks.getMonthlyHistory).not.toHaveBeenCalled();
		}
	);

	it.each([
		{ month: '1', year: '2026', direction: '-1', expectedMonth: 12, expectedYear: 2025 },
		{ month: '12', year: '2025', direction: '1', expectedMonth: 1, expectedYear: 2026 }
	])('change d’année en naviguant par mois', async ({ month, year, direction, expectedMonth, expectedYear }) => {
		const result = await selectHistory(selection({ month, year, direction, season: '2' }));
		expect(result).toMatchObject({ month: expectedMonth, year: expectedYear, selectedSeasonId: 2 });
		expect(mocks.getMonthlyHistory).toHaveBeenCalledWith(expectedMonth, expectedYear);
	});

	it('redirige les anciennes URL avec paramètres vers l’historique sans paramètres', async () => {
		await expect(load(event('?month=2&year=2025&season=2')))
			.rejects.toMatchObject({ status: 303, location: '/history' });
	});

	it('refuse un formulaire incomplet', async () => {
		await expect(selectHistory(selection({ month: '2' }))).rejects.toMatchObject({ status: 400 });
	});

	it('signale une erreur de synthèse sans exposer son détail', async () => {
		mocks.getMonthlyHistory.mockRejectedValue(new Error('private database details'));
		const result = await load(event());
		expect(result).toMatchObject({ databaseError: true, monthly: null, seasonal: null });
		expect(mocks.logError).toHaveBeenCalledWith('historyFailed', expect.any(Error), expect.any(Object));
	});

	it('conserve les synthèses lorsque le stock échoue', async () => {
		mocks.getStockStatus.mockRejectedValue(new Error('private database details'));
		const result = await selectHistory(selection({ month: '2', year: '2025', season: '2' }));
		expect(result).toMatchObject({ databaseError: false, stock: { status: 'error' } });
		expect(mocks.logError).toHaveBeenCalledWith('stockStatusFailed', expect.any(Error));
	});
});
