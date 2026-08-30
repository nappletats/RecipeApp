<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="flex min-h-screen items-center justify-center px-4">
	<form
		method="POST"
		use:enhance
		class="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
	>
		<h1 class="text-center text-xl font-semibold">🍳 Recipes</h1>

		{#if form?.error}
			<p class="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{form.error}</p>
		{/if}

		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-stone-700">Password</span>
			<input
				name="password"
				type="password"
				autofocus
				required
				class="rounded-lg border border-stone-300 px-4 py-3 text-base"
			/>
		</label>

		<button
			type="submit"
			class="rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white active:bg-orange-700"
		>
			Sign in
		</button>
	</form>
</div>
