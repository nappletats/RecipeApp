import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { fetchRecipeFromUrl } from '$lib/server/import/jsonld';
import { isSafeImportUrl } from '$lib/server/import/safe-url';
import { parseRecipeForm, createRecipe } from '$lib/server/recipes';

export const actions: Actions = {
	fetch: async ({ request }) => {
		const form = await request.formData();
		const url = String(form.get('url') ?? '').trim();

		if (!url) {
			return fail(400, { error: 'Paste a recipe URL', url: '' });
		}

		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			return fail(400, { error: "That doesn't look like a valid URL", url });
		}
		if (!isSafeImportUrl(parsedUrl)) {
			return fail(400, { error: "That URL can't be imported", url });
		}

		let result: Awaited<ReturnType<typeof fetchRecipeFromUrl>> | null = null;
		let fetchError: string | null = null;
		try {
			result = await fetchRecipeFromUrl(parsedUrl.toString());
		} catch (err) {
			// Some sites (notably ones with aggressive bot protection) refuse
			// automated fetches outright — that's not recoverable by retrying,
			// so land in the same prefilled edit form as "no recipe data found"
			// rather than a dead-end error the user has to click out of.
			fetchError = err instanceof Error ? err.message : 'Could not fetch that page';
		}

		if (!result?.parsed) {
			return {
				imported: true,
				found: false,
				fetchError,
				sourceUrl: url,
				title: result?.pageTitle ?? '',
				servings: '',
				prepTimeMinutes: null,
				cookTimeMinutes: null,
				ingredientsText: '',
				stepsText: '',
				tagsText: '',
				imageUrl: null
			};
		}

		return {
			imported: true,
			found: true,
			sourceUrl: url,
			tagsText: '',
			...result.parsed
		};
	},

	create: async ({ request }) => {
		const form = await request.formData();
		const input = parseRecipeForm(form);
		const sourceUrl = String(form.get('sourceUrl') ?? '').trim() || null;
		const imageUrl = String(form.get('imageUrl') ?? '').trim() || null;

		if (!input.title) {
			return fail(400, {
				imported: true,
				found: true,
				error: 'Title is required',
				sourceUrl,
				imageUrl,
				...input
			});
		}

		const recipeId = await createRecipe(input, { type: 'url', url: sourceUrl, imageUrl });
		redirect(303, `/recipes/${recipeId}`);
	}
};
