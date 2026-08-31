<script lang="ts">
	import { enhance } from '$app/forms';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Import recipe</title></svelte:head>

<h1 class="pt-4 text-xl font-semibold">Import from a URL</h1>

{#if !form?.imported}
	<form method="POST" action="?/fetch" use:enhance class="flex flex-col gap-4 py-4">
		{#if form?.error}
			<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</p>
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-700">Recipe URL</span>
			<input
				name="url"
				type="url"
				inputmode="url"
				required
				autofocus
				value={form?.url ?? ''}
				placeholder="https://example.com/recipes/chocolate-cake"
				class="rounded-lg border border-stone-300 px-4 py-3 text-base"
			/>
		</label>

		<button
			type="submit"
			class="rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white active:bg-orange-700"
		>
			Fetch recipe
		</button>

		<div class="flex flex-col items-center gap-1">
			<a href="/recipes/new" class="text-sm text-stone-500">Enter manually instead</a>
			<a href="/recipes/capture" class="text-sm text-stone-500">Scan a cookbook page instead</a>
		</div>
	</form>
{:else}
	{#if form.found === false}
		<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
			Couldn't find structured recipe data on that page — double-check and fill in the rest by
			hand.
		</p>
	{:else}
		<p class="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
			Imported — review and edit before saving.
		</p>
	{/if}

	<RecipeForm
		title={form.title ?? ''}
		servings={form.servings ?? ''}
		prepTimeMinutes={form.prepTimeMinutes ?? null}
		cookTimeMinutes={form.cookTimeMinutes ?? null}
		ingredientsText={form.ingredientsText ?? ''}
		stepsText={form.stepsText ?? ''}
		tagsText={form.tagsText ?? ''}
		sourceUrl={form.sourceUrl ?? null}
		imageUrl={form.imageUrl ?? null}
		error={form.error ?? ''}
		formAction="?/create"
		submitLabel="Save recipe"
	/>
{/if}
