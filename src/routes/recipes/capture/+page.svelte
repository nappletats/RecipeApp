<script lang="ts">
	import { enhance } from '$app/forms';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let scanning = $state(false);
</script>

<svelte:head><title>Scan a cookbook page</title></svelte:head>

<h1 class="pt-4 text-xl font-semibold">Scan a cookbook page</h1>

{#if !form?.scanned}
	<form
		method="POST"
		action="?/scan"
		enctype="multipart/form-data"
		use:enhance={() => {
			scanning = true;
			return async ({ update }) => {
				await update();
				scanning = false;
			};
		}}
		class="flex flex-col gap-4 py-4"
	>
		{#if form?.error}
			<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</p>
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-700">Photo</span>
			<input
				name="photo"
				type="file"
				accept="image/*"
				capture="environment"
				required
				class="rounded-lg border border-stone-300 px-4 py-3 text-base"
			/>
		</label>

		<button
			type="submit"
			disabled={scanning}
			class="rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white active:bg-orange-700 disabled:opacity-60"
		>
			{scanning ? 'Reading photo… this can take a moment' : 'Scan photo'}
		</button>

		<div class="flex flex-col items-center gap-1">
			<a href="/recipes/new" class="text-sm text-stone-500">Enter manually instead</a>
			<a href="/recipes/import" class="text-sm text-stone-500">Import from URL instead</a>
		</div>
	</form>
{:else}
	<p class="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
		Text extracted below — it's not split into ingredients vs. steps automatically, so copy the
		relevant lines into the right fields as you fill in the form.
	</p>

	<label class="mt-4 flex flex-col gap-1">
		<span class="text-sm font-medium text-stone-700">Extracted text</span>
		<textarea
			readonly
			rows="8"
			value={form.rawText}
			class="rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-600"
		></textarea>
	</label>

	<RecipeForm
		title={form.title ?? ''}
		servings={form.servings ?? ''}
		prepTimeMinutes={form.prepTimeMinutes ?? null}
		cookTimeMinutes={form.cookTimeMinutes ?? null}
		ingredientsText={form.ingredientsText ?? ''}
		stepsText={form.stepsText ?? ''}
		tagsText={form.tagsText ?? ''}
		rawText={form.rawText ?? null}
		error={form.error ?? ''}
		formAction="?/create"
		submitLabel="Save recipe"
	/>
{/if}
