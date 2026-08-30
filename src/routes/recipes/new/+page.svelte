<script lang="ts">
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>New recipe</title></svelte:head>

<h1 class="pt-4 text-xl font-semibold">New recipe</h1>

<RecipeForm
	title={form?.title ?? ''}
	servings={form?.servings ?? ''}
	prepTimeMinutes={form?.prepTimeMinutes ?? null}
	cookTimeMinutes={form?.cookTimeMinutes ?? null}
	ingredientsText={form?.ingredientsText ?? ''}
	stepsText={form?.stepsText ?? ''}
	tagsText={form?.tagsText ?? ''}
	error={form?.error ?? ''}
	submitLabel="Save recipe"
/>
