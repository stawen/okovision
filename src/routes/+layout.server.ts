import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({ language: locals.language });
