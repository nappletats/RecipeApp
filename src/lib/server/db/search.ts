import { db } from './index';
import { recipes, ingredients, steps, tags, recipeTags, notes } from './schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface RecipeSummary {
	id: number;
	title: string;
	sourceType: string;
	sourceUrl: string | null;
	imageUrl: string | null;
	servings: string | null;
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	createdAt: string;
	updatedAt: string;
}

export async function refreshSearchIndex(recipeId: number): Promise<void> {
	const [recipe] = await db.select().from(recipes).where(eq(recipes.id, recipeId));

	await db.run(sql`DELETE FROM search_index WHERE recipe_id = ${recipeId}`);
	if (!recipe) return;

	const ingredientRows = await db
		.select({ rawText: ingredients.rawText })
		.from(ingredients)
		.where(eq(ingredients.recipeId, recipeId));
	const stepRows = await db
		.select({ instruction: steps.instruction })
		.from(steps)
		.where(eq(steps.recipeId, recipeId));
	const noteRows = await db
		.select({ body: notes.body })
		.from(notes)
		.where(eq(notes.recipeId, recipeId));
	const tagRows = await db
		.select({ name: tags.name })
		.from(recipeTags)
		.innerJoin(tags, eq(recipeTags.tagId, tags.id))
		.where(eq(recipeTags.recipeId, recipeId));

	await db.run(sql`
		INSERT INTO search_index (recipe_id, title, ingredients_text, steps_text, tags_text, notes_text)
		VALUES (
			${recipeId},
			${recipe.title},
			${ingredientRows.map((i) => i.rawText).join('\n')},
			${stepRows.map((s) => s.instruction).join('\n')},
			${tagRows.map((t) => t.name).join(' ')},
			${noteRows.map((n) => n.body).join('\n')}
		)
	`);
}

interface RawRecipeRow {
	id: number;
	title: string;
	source_type: string;
	source_url: string | null;
	image_url: string | null;
	servings: string | null;
	prep_time_minutes: number | null;
	cook_time_minutes: number | null;
	created_at: string;
	updated_at: string;
}

function mapRow(r: RawRecipeRow): RecipeSummary {
	return {
		id: r.id,
		title: r.title,
		sourceType: r.source_type,
		sourceUrl: r.source_url,
		imageUrl: r.image_url,
		servings: r.servings,
		prepTimeMinutes: r.prep_time_minutes,
		cookTimeMinutes: r.cook_time_minutes,
		createdAt: r.created_at,
		updatedAt: r.updated_at
	};
}

export async function searchRecipes(query: string): Promise<RecipeSummary[]> {
	const trimmed = query.trim();
	if (!trimmed) {
		return db.select().from(recipes).orderBy(desc(recipes.createdAt));
	}

	const ftsQuery = trimmed
		.split(/\s+/)
		.map((term) => `"${term.replace(/"/g, '""')}"*`)
		.join(' ');

	const rows = await db.all<RawRecipeRow>(sql`
		SELECT recipes.id, recipes.title, recipes.source_type, recipes.source_url, recipes.image_url,
		       recipes.servings, recipes.prep_time_minutes, recipes.cook_time_minutes,
		       recipes.created_at, recipes.updated_at
		FROM search_index
		JOIN recipes ON recipes.id = search_index.recipe_id
		WHERE search_index MATCH ${ftsQuery}
		ORDER BY search_index.rank
	`);

	return rows.map(mapRow);
}
