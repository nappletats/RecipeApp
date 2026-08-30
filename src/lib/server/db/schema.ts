import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const recipes = sqliteTable('recipes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	sourceType: text('source_type', { enum: ['manual', 'url', 'photo'] })
		.notNull()
		.default('manual'),
	sourceUrl: text('source_url'),
	imageUrl: text('image_url'),
	servings: text('servings'),
	prepTimeMinutes: integer('prep_time_minutes'),
	cookTimeMinutes: integer('cook_time_minutes'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(current_timestamp)`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(current_timestamp)`)
});

export const ingredients = sqliteTable('ingredients', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	recipeId: integer('recipe_id')
		.notNull()
		.references(() => recipes.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	rawText: text('raw_text').notNull(),
	quantity: text('quantity'),
	unit: text('unit'),
	name: text('name')
});

export const steps = sqliteTable('steps', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	recipeId: integer('recipe_id')
		.notNull()
		.references(() => recipes.id, { onDelete: 'cascade' }),
	position: integer('position').notNull(),
	instruction: text('instruction').notNull()
});

export const tags = sqliteTable('tags', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique()
});

export const recipeTags = sqliteTable(
	'recipe_tags',
	{
		recipeId: integer('recipe_id')
			.notNull()
			.references(() => recipes.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.recipeId, t.tagId] })]
);

export const notes = sqliteTable('notes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	recipeId: integer('recipe_id')
		.notNull()
		.references(() => recipes.id, { onDelete: 'cascade' }),
	body: text('body').notNull(),
	rating: integer('rating'),
	cookedAt: text('cooked_at')
		.notNull()
		.default(sql`(date('now'))`),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(current_timestamp)`)
});

export const recipesRelations = relations(recipes, ({ many }) => ({
	ingredients: many(ingredients),
	steps: many(steps),
	notes: many(notes),
	recipeTags: many(recipeTags)
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
	recipe: one(recipes, { fields: [ingredients.recipeId], references: [recipes.id] })
}));

export const stepsRelations = relations(steps, ({ one }) => ({
	recipe: one(recipes, { fields: [steps.recipeId], references: [recipes.id] })
}));

export const notesRelations = relations(notes, ({ one }) => ({
	recipe: one(recipes, { fields: [notes.recipeId], references: [recipes.id] })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
	recipeTags: many(recipeTags)
}));

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
	recipe: one(recipes, { fields: [recipeTags.recipeId], references: [recipes.id] }),
	tag: one(tags, { fields: [recipeTags.tagId], references: [tags.id] })
}));
