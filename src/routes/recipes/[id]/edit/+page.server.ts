import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getRecipeDetail, parseRecipeForm, updateRecipe } from '$lib/server/recipes';

export const load: PageServerLoad = async ({ params }) => {
	const detail = await getRecipeDetail(Number(params.id));
	if (!detail) error(404, 'Recipe not found');

	return {
		recipe: detail.recipe,
		ingredientsText: detail.ingredients.map((i) => i.rawText).join('\n'),
		stepsText: detail.steps.map((s) => s.instruction).join('\n'),
		tagsText: detail.tags.join(', ')
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const recipeId = Number(params.id);
		const input = parseRecipeForm(await request.formData());
		if (!input.title) {
			return fail(400, { error: 'Title is required', ...input });
		}

		await updateRecipe(recipeId, input);
		redirect(303, `/recipes/${recipeId}`);
	}
};
