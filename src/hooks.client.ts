import type { HandleClientError } from '@sveltejs/kit/hooks';
import { publicErrorMessage } from '#lib/ui/i18n.js';

/**
 * Logs unexpected client errors and returns a localized public message for non-application errors
 * when the page language is supported. Application errors are not rewritten here.
 */
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind === 'unknown') console.error(error);
	if (kind === 'app') return;
	const language = document.documentElement.lang;
	if (language !== 'fr' && language !== 'en') return;
	return { message: publicErrorMessage(language, kind === 'unknown' ? 500 : error.status) };
};
