<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchValue = $state(data.q);
	let debounceHandle: ReturnType<typeof setTimeout> | undefined;

	function onInput() {
		clearTimeout(debounceHandle);
		debounceHandle = setTimeout(() => {
			const url = searchValue ? `/?q=${encodeURIComponent(searchValue)}` : '/';
			goto(url, { keepFocus: true, replaceState: true, noScroll: true });
		}, 250);
	}

	function timeSummary(prep: number | null, cook: number | null): string | null {
		const total = (prep ?? 0) + (cook ?? 0);
		return total > 0 ? `${total} min` : null;
	}
</script>

<svelte:head><title>Recipes</title></svelte:head>

<div class="flex flex-col gap-4 py-4">
	<form method="GET" class="flex gap-2">
		<input
			name="q"
			type="search"
			placeholder="Search recipes, ingredients, notes…"
			bind:value={searchValue}
			oninput={onInput}
			class="w-full rounded-full border border-stone-300 bg-white px-5 py-3 text-base shadow-sm"
		/>
	</form>

	{#if data.recipes.length === 0}
		<div class="mt-12 flex flex-col items-center gap-3 text-center text-stone-500">
			{#if data.q}
				<p>No recipes match "{data.q}".</p>
			{:else}
				<p>No recipes yet.</p>
				<a href="/recipes/new" class="font-semibold text-orange-600">Add your first recipe →</a>
			{/if}
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.recipes as recipe (recipe.id)}
				<li>
					<a
						href="/recipes/{recipe.id}"
						class="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm active:bg-stone-100"
					>
						<div class="flex flex-col gap-0.5">
							<span class="text-base font-semibold">{recipe.title}</span>
							{#if recipe.servings || timeSummary(recipe.prepTimeMinutes, recipe.cookTimeMinutes)}
								<span class="text-sm text-stone-500">
									{[recipe.servings, timeSummary(recipe.prepTimeMinutes, recipe.cookTimeMinutes)]
										.filter(Boolean)
										.join(' · ')}
								</span>
							{/if}
						</div>
						<span class="text-stone-300">›</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
