<script lang="ts">
	import { enhance } from '$app/forms';
	import RecipeForm from '$lib/components/RecipeForm.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let scanning = $state(false);
	let resizing = $state(false);
	let timedOut = $state(false);

	// Phone camera photos are routinely 10-20MB at full resolution, which
	// both blows past reasonable upload limits and makes Tesseract painfully
	// slow (OCR time scales with pixel count, and Render's free tier has
	// limited CPU). Shrinking client-side before upload fixes both — OCR
	// doesn't need anywhere near full camera resolution to read page text.
	// Real photographed text (paper grain, lighting, slight blur) is far
	// harder for Tesseract than clean rendered text, so this stays modest.
	const MAX_DIMENSION = 1500;
	const SCAN_TIMEOUT_MS = 90_000;

	async function resizeImage(file: File): Promise<File> {
		try {
			const bitmap = await createImageBitmap(file);
			let { width, height } = bitmap;
			if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
				const scale = MAX_DIMENSION / Math.max(width, height);
				width = Math.round(width * scale);
				height = Math.round(height * scale);
			}

			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return file;
			ctx.drawImage(bitmap, 0, 0, width, height);

			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, 'image/jpeg', 0.85)
			);
			if (!blob) return file;

			return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
		} catch {
			// Fall back to the original file — the server still validates size/type.
			return file;
		}
	}

	async function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		resizing = true;
		const resized = await resizeImage(file);
		resizing = false;

		const dt = new DataTransfer();
		dt.items.add(resized);
		input.files = dt.files;
	}
</script>

<svelte:head><title>Scan a cookbook page</title></svelte:head>

<h1 class="pt-4 text-xl font-semibold">Scan a cookbook page</h1>

{#if !form?.scanned}
	<form
		method="POST"
		action="?/scan"
		enctype="multipart/form-data"
		use:enhance={({ controller }) => {
			scanning = true;
			timedOut = false;

			// use:enhance silently swallows AbortError and never invokes our
			// callback below when a request is aborted, so the UI state reset
			// can't live there — it has to happen directly in this timer.
			const timeoutId = setTimeout(() => {
				controller.abort();
				scanning = false;
				timedOut = true;
			}, SCAN_TIMEOUT_MS);

			return async ({ update }) => {
				clearTimeout(timeoutId);
				await update();
				scanning = false;
			};
		}}
		class="flex flex-col gap-4 py-4"
	>
		{#if timedOut}
			<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
				That took too long to read (over {SCAN_TIMEOUT_MS / 1000}s) — try a clearer, closer, or
				better-lit photo of a smaller section of the page.
			</p>
		{/if}
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
				onchange={onFileChange}
				class="rounded-lg border border-stone-300 px-4 py-3 text-base"
			/>
		</label>

		<button
			type="submit"
			disabled={scanning || resizing}
			class="rounded-lg bg-orange-600 px-4 py-3 text-base font-semibold text-white active:bg-orange-700 disabled:opacity-60"
		>
			{#if resizing}
				Preparing photo…
			{:else if scanning}
				Reading photo… this can take a moment
			{:else}
				Scan photo
			{/if}
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
