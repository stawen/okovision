import type { HandleClientError } from '@sveltejs/kit/hooks';
import { publicErrorMessage } from '#lib/i18n.js';

export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind === 'unknown') console.error(error);
	if (kind === 'app') return;
	const language = document.documentElement.lang;
	if (language !== 'fr' && language !== 'en') return;
	return { message: publicErrorMessage(language, kind === 'unknown' ? 500 : error.status) };
};
