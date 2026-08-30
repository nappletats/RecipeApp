<script lang="ts">
	import { enhance } from '$app/forms';

	interface Props {
		title?: string;
		servings?: string | null;
		prepTimeMinutes?: number | null;
		cookTimeMinutes?: number | null;
		ingredientsText?: string;
		stepsText?: string;
		tagsText?: string;
		submitLabel?: string;
		error?: string;
	}

	let {
		title = '',
		servings = '',
		prepTimeMinutes = null,
		cookTimeMinutes = null,
		ingredientsText = '',
		stepsText = '',
		tagsText = '',
		submitLabel = 'Save recipe',
		error = ''
	}: Props = $props();
</script>

<form method="POST" use:enhance class="flex flex-col gap-5 py-4">
	{#if error}
		<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
	{/if}

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-stone-700">Title</span>
		<input
			name="title"
			type="text"
			required
			value={title}
			class="rounded-lg border border-stone-300 px-4 py-3 text-base"
		/>
	</label>

	<div class="grid grid-cols-3 gap-3">
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-700">Servings</span>
			<input
				name="servings"
				type="text"
				value={servings ?? ''}
				placeholder="4-6"
				class="rounded-lg border border-stone-300 px-3 py-3 text-base"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-700">Prep (min)</span>
			<input
				name="prepTimeMinutes"
				type="number"
				min="0"
				value={prepTimeMinutes ?? ''}
				class="rounded-lg border border-stone-300 px-3 py-3 text-base"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-700">Cook (min)</span>
			<input
				name="cookTimeMinutes"
				type="number"
				min="0"
				value={cookTimeMinutes ?? ''}
				class="rounded-lg border border-stone-300 px-3 py-3 text-base"
			/>
		</label>
	</div>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-stone-700"
			>Ingredients <span class="font-normal text-stone-400">(one per line)</span></span
		>
		<textarea
			name="ingredientsText"
			rows="8"
			placeholder={'2 cups flour\n1 tsp salt\n3 eggs'}
			class="rounded-lg border border-stone-300 px-4 py-3 text-base">{ingredientsText}</textarea
		>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-stone-700"
			>Steps <span class="font-normal text-stone-400">(one per line)</span></span
		>
		<textarea
			name="stepsText"
			rows="8"
			placeholder={'Preheat oven to 350°F\nMix dry ingredients\nBake for 25 minutes'}
			class="rounded-lg border border-stone-300 px-4 py-3 text-base">{stepsText}</textarea
		>
	</label>

	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-stone-700"
			>Tags <span class="font-normal text-stone-400">(comma separated)</span></span
		>
		<input
			name="tagsText"
			type="text"
			value={tagsText}
			placeholder="weeknight, pasta, vegetarian"
			class="rounded-lg border border-stone-300 px-4 py-3 text-base"
		/>
	</label>

	<button
		type="submit"
		class="rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white active:bg-orange-700"
	>
		{submitLabel}
	</button>
</form>
