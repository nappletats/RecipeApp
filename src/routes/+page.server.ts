import type { PageServerLoad } from './$types';
import { searchRecipes } from '$lib/server/db/search';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const recipes = await searchRecipes(q);
	return { recipes, q };
};
