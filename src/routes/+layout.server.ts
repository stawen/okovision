import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, route }) => ({
	language: locals.language,
	member: locals.member,
	pathname: route.id
});
