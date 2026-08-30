import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getRecipeDetail, addNote, deleteRecipe } from '$lib/server/recipes';

export const load: PageServerLoad = async ({ params }) => {
	const detail = await getRecipeDetail(Number(params.id));
	if (!detail) error(404, 'Recipe not found');
	return detail;
};

export const actions: Actions = {
	addNote: async ({ request, params }) => {
		const recipeId = Number(params.id);
		const form = await request.formData();
		const body = String(form.get('body') ?? '').trim();
		const ratingRaw = String(form.get('rating') ?? '').trim();
		const cookedAtRaw = String(form.get('cookedAt') ?? '').trim();

		if (!body) {
			return fail(400, { noteError: 'Note cannot be empty' });
		}

		await addNote(recipeId, body, ratingRaw ? Number(ratingRaw) : null, cookedAtRaw || null);
		return { success: true };
	},

	delete: async ({ params }) => {
		await deleteRecipe(Number(params.id));
		redirect(303, '/');
	}
};
