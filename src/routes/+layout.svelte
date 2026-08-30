<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-stone-50 text-stone-900">
	{#if page.url.pathname !== '/login'}
		<header class="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
			<div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
				<a href="/" class="text-lg font-semibold tracking-tight">🍳 Recipes</a>
				<a
					href="/recipes/new"
					class="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white active:bg-orange-700"
				>
					+ New
				</a>
			</div>
		</header>
	{/if}
	<main class="mx-auto max-w-2xl px-4 pb-16">
		{@render children()}
	</main>
</div>
