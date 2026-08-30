import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { parseRecipeForm, createRecipe } from '$lib/server/recipes';

export const actions: Actions = {
	default: async ({ request }) => {
		const input = parseRecipeForm(await request.formData());
		if (!input.title) {
			return fail(400, { error: 'Title is required', ...input });
		}

		const recipeId = await createRecipe(input);
		redirect(303, `/recipes/${recipeId}`);
	}
};
