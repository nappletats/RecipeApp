import { db } from './db';
import { recipes, ingredients, steps, tags, recipeTags, notes } from './db/schema';
import { refreshSearchIndex } from './db/search';
import { eq, asc, desc } from 'drizzle-orm';

export interface RecipeFormInput {
	title: string;
	servings: string | null;
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	ingredientsText: string;
	stepsText: string;
	tagsText: string;
}

export function parseRecipeForm(form: FormData): RecipeFormInput {
	const prepRaw = String(form.get('prepTimeMinutes') ?? '').trim();
	const cookRaw = String(form.get('cookTimeMinutes') ?? '').trim();

	return {
		title: String(form.get('title') ?? '').trim(),
		servings: String(form.get('servings') ?? '').trim() || null,
		prepTimeMinutes: prepRaw ? Number(prepRaw) : null,
		cookTimeMinutes: cookRaw ? Number(cookRaw) : null,
		ingredientsText: String(form.get('ingredientsText') ?? ''),
		stepsText: String(form.get('stepsText') ?? ''),
		tagsText: String(form.get('tagsText') ?? '')
	};
}

function splitLines(text: string): string[] {
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

function splitTags(text: string): string[] {
	return text
		.split(',')
		.map((tag) => tag.trim().toLowerCase())
		.filter(Boolean);
}

async function upsertTagIds(tagNames: string[]): Promise<number[]> {
	const ids: number[] = [];
	for (const name of tagNames) {
		const existing = await db.select().from(tags).where(eq(tags.name, name));
		if (existing.length) {
			ids.push(existing[0].id);
			continue;
		}
		const [created] = await db.insert(tags).values({ name }).returning();
		ids.push(created.id);
	}
	return ids;
}

async function writeRecipeLines(recipeId: number, input: RecipeFormInput): Promise<void> {
	const ingredientLines = splitLines(input.ingredientsText);
	const stepLines = splitLines(input.stepsText);
	const tagNames = splitTags(input.tagsText);

	if (ingredientLines.length) {
		await db
			.insert(ingredients)
			.values(ingredientLines.map((rawText, position) => ({ recipeId, position, rawText })));
	}
	if (stepLines.length) {
		await db
			.insert(steps)
			.values(stepLines.map((instruction, position) => ({ recipeId, position, instruction })));
	}
	if (tagNames.length) {
		const tagIds = await upsertTagIds(tagNames);
		await db.insert(recipeTags).values(tagIds.map((tagId) => ({ recipeId, tagId })));
	}
}

export async function createRecipe(
	input: RecipeFormInput,
	source: { type: 'manual' | 'url' | 'photo'; url?: string | null; imageUrl?: string | null } = {
		type: 'manual'
	}
): Promise<number> {
	const [recipe] = await db
		.insert(recipes)
		.values({
			title: input.title,
			sourceType: source.type,
			sourceUrl: source.url ?? null,
			imageUrl: source.imageUrl ?? null,
			servings: input.servings,
			prepTimeMinutes: input.prepTimeMinutes,
			cookTimeMinutes: input.cookTimeMinutes
		})
		.returning();

	await writeRecipeLines(recipe.id, input);
	await refreshSearchIndex(recipe.id);
	return recipe.id;
}

export async function updateRecipe(recipeId: number, input: RecipeFormInput): Promise<void> {
	await db
		.update(recipes)
		.set({
			title: input.title,
			servings: input.servings,
			prepTimeMinutes: input.prepTimeMinutes,
			cookTimeMinutes: input.cookTimeMinutes,
			updatedAt: new Date().toISOString()
		})
		.where(eq(recipes.id, recipeId));

	await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
	await db.delete(steps).where(eq(steps.recipeId, recipeId));
	await db.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId));

	await writeRecipeLines(recipeId, input);
	await refreshSearchIndex(recipeId);
}

export async function deleteRecipe(recipeId: number): Promise<void> {
	await db.delete(recipes).where(eq(recipes.id, recipeId));
	await refreshSearchIndex(recipeId);
}

export async function getRecipeDetail(recipeId: number) {
	const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));
	if (!recipe) return null;

	const [ingredientRows, stepRows, noteRows, tagRows] = await Promise.all([
		db
			.select()
			.from(ingredients)
			.where(eq(ingredients.recipeId, recipeId))
			.orderBy(asc(ingredients.position)),
		db.select().from(steps).where(eq(steps.recipeId, recipeId)).orderBy(asc(steps.position)),
		db.select().from(notes).where(eq(notes.recipeId, recipeId)).orderBy(desc(notes.cookedAt)),
		db
			.select({ name: tags.name })
			.from(recipeTags)
			.innerJoin(tags, eq(recipeTags.tagId, tags.id))
			.where(eq(recipeTags.recipeId, recipeId))
	]);

	return {
		recipe,
		ingredients: ingredientRows,
		steps: stepRows,
		notes: noteRows,
		tags: tagRows.map((t) => t.name)
	};
}

export async function addNote(
	recipeId: number,
	body: string,
	rating: number | null,
	cookedAt: string | null
): Promise<void> {
	await db.insert(notes).values({
		recipeId,
		body,
		rating,
		...(cookedAt ? { cookedAt } : {})
	});
	await refreshSearchIndex(recipeId);
}
