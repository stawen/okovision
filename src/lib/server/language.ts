import type { Language } from '../i18n.ts';
import { loadServerEnvironment } from './environment.ts';

export class InvalidLanguageError extends Error {
	constructor() {
		super('APP_LANG doit être FR ou EN / APP_LANG must be FR or EN.');
		this.name = 'InvalidLanguageError';
	}
}

export function getAppLanguage(): Language {
	loadServerEnvironment();
	const language = process.env.APP_LANG?.trim().toUpperCase() ?? 'FR';
	if (language === 'FR') return 'fr';
	if (language === 'EN') return 'en';
	throw new InvalidLanguageError();
}
