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

		let result;
		try {
			result = await fetchRecipeFromUrl(parsedUrl.toString());
		} catch (err) {
			return fail(502, {
				error: err instanceof Error ? err.message : 'Could not fetch that page',
				url
			});
		}

		if (!result.parsed) {
			// No Recipe structured data on the page — fall back to a mostly-blank
			// prefilled form rather than a dead end, per the "always land in the
			// shared edit form" rule.
			return {
				imported: true,
				found: false,
				sourceUrl: url,
				title: result.pageTitle ?? '',
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
