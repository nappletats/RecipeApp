<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function formatDate(value: string): string {
		// Parse the date part as local-time components — passing a date-only
		// string straight to `new Date()` treats it as UTC midnight, which
		// rolls back a day once formatted in a negative-UTC-offset timezone.
		// Handles both "YYYY-MM-DD" (explicit note date) and the DB default
		// "YYYY-MM-DD HH:MM:SS" (current_timestamp, no date chosen).
		const [year, month, day] = value.slice(0, 10).split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	let today = new Date().toISOString().slice(0, 10);
</script>

<svelte:head><title>{data.recipe.title}</title></svelte:head>

<div class="flex flex-col gap-6 py-4">
	<div class="flex items-start justify-between gap-3">
		<h1 class="text-2xl font-semibold">{data.recipe.title}</h1>
		<div class="flex shrink-0 gap-2">
			<a
				href="/recipes/{data.recipe.id}/edit"
				class="rounded-full border border-stone-300 px-4 py-2.5 text-sm font-medium active:bg-stone-100"
			>
				Edit
			</a>
		</div>
	</div>

	<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
		{#if data.recipe.servings}<span>{data.recipe.servings}</span>{/if}
		{#if data.recipe.prepTimeMinutes}<span>Prep {data.recipe.prepTimeMinutes} min</span>{/if}
		{#if data.recipe.cookTimeMinutes}<span>Cook {data.recipe.cookTimeMinutes} min</span>{/if}
		{#if data.recipe.sourceUrl}
			<a href={data.recipe.sourceUrl} target="_blank" rel="noopener" class="text-orange-600"
				>Source ↗</a
			>
		{/if}
	</div>

	{#if data.tags.length}
		<div class="flex flex-wrap gap-2">
			{#each data.tags as tag}
				<span class="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-700"
					>{tag}</span
				>
			{/each}
		</div>
	{/if}

	<section class="flex flex-col gap-2">
		<h2 class="text-lg font-semibold">Ingredients</h2>
		<ul class="flex flex-col gap-1.5">
			{#each data.ingredients as ingredient (ingredient.id)}
				<li class="flex gap-2 text-base">
					<span class="text-stone-400">•</span>
					{ingredient.rawText}
				</li>
			{/each}
		</ul>
	</section>

	<section class="flex flex-col gap-2">
		<h2 class="text-lg font-semibold">Steps</h2>
		<ol class="flex flex-col gap-3">
			{#each data.steps as step, i (step.id)}
				<li class="flex gap-3 text-base">
					<span class="font-semibold text-orange-600">{i + 1}.</span>
					{step.instruction}
				</li>
			{/each}
		</ol>
	</section>

	<section class="flex flex-col gap-3 border-t border-stone-200 pt-6">
		<h2 class="text-lg font-semibold">Notes &amp; adjustments</h2>

		<form
			method="POST"
			action="?/addNote"
			use:enhance
			class="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4"
		>
			{#if form?.noteError}
				<p class="text-sm text-red-700">{form.noteError}</p>
			{/if}
			<textarea
				name="body"
				rows="3"
				required
				placeholder="What did you change? How did it turn out?"
				class="rounded-lg border border-stone-300 px-3 py-2 text-base"
			></textarea>
			<div class="flex items-center gap-3">
				<label class="flex items-center gap-2 text-sm text-stone-600">
					Rating
					<select name="rating" class="rounded-lg border border-stone-300 px-2 py-1.5 text-base">
						<option value="">—</option>
						{#each [1, 2, 3, 4, 5] as n}
							<option value={n}>{n}</option>
						{/each}
					</select>
				</label>
				<label class="flex items-center gap-2 text-sm text-stone-600">
					Date
					<input
						name="cookedAt"
						type="date"
						value={today}
						class="rounded-lg border border-stone-300 px-2 py-1.5 text-base"
					/>
				</label>
				<button
					type="submit"
					class="ml-auto rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-orange-700"
				>
					Add note
				</button>
			</div>
		</form>

		{#if data.notes.length === 0}
			<p class="text-sm text-stone-400">No notes yet — log one after you cook this.</p>
		{:else}
			<ul class="flex flex-col gap-3">
				{#each data.notes as note (note.id)}
					<li class="rounded-xl border border-stone-200 bg-white p-4">
						<div class="mb-1 flex items-center justify-between text-sm text-stone-500">
							<span>{formatDate(note.cookedAt)}</span>
							{#if note.rating}<span>{'★'.repeat(note.rating)}{'☆'.repeat(5 - note.rating)}</span
								>{/if}
						</div>
						<p class="text-base whitespace-pre-wrap">{note.body}</p>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<form
		method="POST"
		action="?/delete"
		use:enhance
		onsubmit={(e) => {
			if (!confirm('Delete this recipe? This cannot be undone.')) e.preventDefault();
		}}
		class="pt-6"
	>
		<button type="submit" class="text-sm font-medium text-red-600">Delete recipe</button>
	</form>
</div>
