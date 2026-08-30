<script lang="ts">
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>Edit {data.recipe.title}</title></svelte:head>

<h1 class="pt-4 text-xl font-semibold">Edit recipe</h1>

<RecipeForm
	title={form?.title ?? data.recipe.title}
	servings={form?.servings ?? data.recipe.servings}
	prepTimeMinutes={form?.prepTimeMinutes ?? data.recipe.prepTimeMinutes}
	cookTimeMinutes={form?.cookTimeMinutes ?? data.recipe.cookTimeMinutes}
	ingredientsText={form?.ingredientsText ?? data.ingredientsText}
	stepsText={form?.stepsText ?? data.stepsText}
	tagsText={form?.tagsText ?? data.tagsText}
	error={form?.error ?? ''}
	submitLabel="Save changes"
/>
