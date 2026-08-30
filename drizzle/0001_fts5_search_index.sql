CREATE VIRTUAL TABLE `search_index` USING fts5(
	`recipe_id` UNINDEXED,
	`title`,
	`ingredients_text`,
	`steps_text`,
	`tags_text`,
	`notes_text`
);
