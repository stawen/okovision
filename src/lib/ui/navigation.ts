import { uiMessages, type Language, type UiTextKey } from './i18n.js';

type PageDefinition = {
	path: string;
	group: 'public' | 'realtime' | 'reports' | 'manual' | 'admin' | 'about' | 'account';
	private: boolean;
	titleKey: UiTextKey;
	descriptionKey: UiTextKey;
};

export const pages = [
	{
		path: '/history', group: 'public', private: false,
		titleKey: 'history', descriptionKey: 'historyDescription'
	},
	{
		path: '/private/realtime/settings', group: 'realtime', private: true,
		titleKey: 'realtimeSettingsTitle', descriptionKey: 'realtimeSettingsDescription'
	},
	{
		path: '/private/realtime/configurations', group: 'realtime', private: true,
		titleKey: 'realtimeConfigurationsTitle', descriptionKey: 'realtimeConfigurationsDescription'
	},
	{
		path: '/private/realtime/charts', group: 'realtime', private: true,
		titleKey: 'realtimeChartsTitle', descriptionKey: 'realtimeChartsDescription'
	},
	{
		path: '/private/configuration/reports', group: 'reports', private: true,
		titleKey: 'dailyReportsTitle', descriptionKey: 'dailyReportsDescription'
	},
	{
		path: '/private/configuration/import-boiler', group: 'manual', private: true,
		titleKey: 'boilerImportTitle', descriptionKey: 'boilerImportDescription'
	},
	{
		path: '/private/configuration/daily-summaries', group: 'manual', private: true,
		titleKey: 'dailySummariesTitle', descriptionKey: 'dailySummariesDescription'
	},
	{
		path: '/private/administration/settings', group: 'admin', private: true,
		titleKey: 'settingsTitle', descriptionKey: 'settingsDescription'
	},
	{
		path: '/private/administration/seasons', group: 'admin', private: true,
		titleKey: 'seasonsTitle', descriptionKey: 'seasonsDescription'
	},
	{
		path: '/private/administration/events', group: 'admin', private: true,
		titleKey: 'maintenanceEventsTitle', descriptionKey: 'maintenanceEventsDescription'
	},
	{
		path: '/private/administration/csv-mapping', group: 'admin', private: true,
		titleKey: 'csvMappingTitle', descriptionKey: 'csvMappingDescription'
	},
	{
		path: '/private/about', group: 'about', private: true,
		titleKey: 'about', descriptionKey: 'aboutDescription'
	},
	{
		path: '/private/account', group: 'account', private: true,
		titleKey: 'account', descriptionKey: 'accountDescription'
	},
	{
		path: '/setup', group: 'public', private: false,
		titleKey: 'setupTitle', descriptionKey: 'setupDescription'
	}
] as const satisfies readonly PageDefinition[];

export type ScopePath = (typeof pages)[number]['path'];

export function findPage(path: ScopePath) {
	const page = pages.find((page) => page.path === path);
	if (!page) throw new Error(`Unknown page: ${path}`);
	return page;
}

export function navigationPages(language: Language) {
	const text = uiMessages(language);
	return pages.map((page) => ({
		...page,
		title: text[page.titleKey],
		description: text[page.descriptionKey]
	}));
}
