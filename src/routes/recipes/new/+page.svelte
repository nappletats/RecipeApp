<script lang="ts">
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>New recipe</title></svelte:head>

<div class="flex items-center justify-between gap-3 pt-4">
	<h1 class="text-xl font-semibold">New recipe</h1>
	<div class="flex flex-col items-end gap-0.5 text-sm font-medium text-orange-600">
		<a href="/recipes/import">Import from URL →</a>
		<a href="/recipes/capture">Scan a cookbook page →</a>
	</div>
</div>

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
