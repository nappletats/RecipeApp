import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { extractTextFromImage } from '$lib/server/ocr/tesseract';
import { parseRecipeForm, createRecipe } from '$lib/server/recipes';

const MAX_UPLOAD_BYTES = 10_000_000;

export const actions: Actions = {
	scan: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('photo');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose a photo first' });
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			return fail(400, { error: 'Photo is too large (max 10MB)' });
		}
		if (!file.type.startsWith('image/')) {
			return fail(400, { error: 'That file is not an image' });
		}

		const buffer = Buffer.from(await file.arrayBuffer());

		let rawText: string;
		try {
			rawText = await extractTextFromImage(buffer);
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'OCR failed' });
		}

		if (!rawText) {
			return fail(422, {
				error: "Couldn't read any text from that photo — try a clearer, well-lit shot"
			});
		}

		return { scanned: true, rawText };
	},

	create: async ({ request }) => {
		const form = await request.formData();
		const input = parseRecipeForm(form);

		if (!input.title) {
			return fail(400, {
				scanned: true,
				rawText: String(form.get('rawText') ?? ''),
				error: 'Title is required',
				...input
			});
		}

		const recipeId = await createRecipe(input, { type: 'photo' });
		redirect(303, `/recipes/${recipeId}`);
	}
};
