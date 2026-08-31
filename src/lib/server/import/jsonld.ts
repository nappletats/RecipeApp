import * as cheerio from 'cheerio';
import { parseIsoDurationToMinutes } from './duration';

export interface ParsedRecipe {
	title: string;
	servings: string | null;
	prepTimeMinutes: number | null;
	cookTimeMinutes: number | null;
	ingredientsText: string;
	stepsText: string;
	imageUrl: string | null;
}

export interface FetchRecipeResult {
	parsed: ParsedRecipe | null;
	pageTitle: string | null;
}

const MAX_RESPONSE_BYTES = 5_000_000;
const FETCH_TIMEOUT_MS = 10_000;

export async function fetchRecipeFromUrl(url: string): Promise<FetchRecipeResult> {
	const res = await fetch(url, {
		headers: {
			'User-Agent':
				'Mozilla/5.0 (compatible; RecipesApp/1.0; +personal recipe manager)'
		},
		redirect: 'follow',
		signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
	});

	if (!res.ok) {
		throw new Error(`Failed to fetch page (HTTP ${res.status})`);
	}

	const contentLength = res.headers.get('content-length');
	if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
		throw new Error('Page is too large to import');
	}

	const html = await res.text();
	const $ = cheerio.load(html);
	const pageTitle = $('title').first().text().trim() || null;

	const recipeNode = findRecipeNode($);
	return {
		parsed: recipeNode ? normalizeRecipeNode(recipeNode) : null,
		pageTitle
	};
}

function findRecipeNode($: cheerio.CheerioAPI): Record<string, unknown> | null {
	const scripts = $('script[type="application/ld+json"]').toArray();

	for (const el of scripts) {
		const text = $(el).contents().text();
		let data: unknown;
		try {
			data = JSON.parse(text);
		} catch {
			continue;
		}

		const found = searchForRecipe(data);
		if (found) return found;
	}

	return null;
}

function searchForRecipe(node: unknown): Record<string, unknown> | null {
	if (Array.isArray(node)) {
		for (const item of node) {
			const found = searchForRecipe(item);
			if (found) return found;
		}
		return null;
	}

	if (node && typeof node === 'object') {
		const obj = node as Record<string, unknown>;
		if (isRecipeType(obj['@type'])) return obj;

		if (Array.isArray(obj['@graph'])) {
			const found = searchForRecipe(obj['@graph']);
			if (found) return found;
		}
	}

	return null;
}

function isRecipeType(type: unknown): boolean {
	if (typeof type === 'string') return type === 'Recipe';
	if (Array.isArray(type)) return type.includes('Recipe');
	return false;
}

function normalizeRecipeNode(node: Record<string, unknown>): ParsedRecipe {
	return {
		title: decodeEntities(firstString(node.name)) ?? '',
		servings: decodeEntities(normalizeYield(node.recipeYield)),
		prepTimeMinutes: parseIsoDurationToMinutes(node.prepTime),
		cookTimeMinutes: parseIsoDurationToMinutes(node.cookTime),
		ingredientsText: decodeEntities(normalizeIngredients(node.recipeIngredient ?? node.ingredients)) ?? '',
		stepsText: decodeEntities(normalizeInstructions(node.recipeInstructions)) ?? '',
		imageUrl: normalizeImage(node.image)
	};
}

// Some sites' JSON-LD leaves HTML entities un-decoded in text fields
// (e.g. "&frac12;" instead of "½", "&#8217;" instead of "'"). Cheerio
// already bundles an HTML entity decoder, so route the string through it
// rather than pulling in a separate dependency.
function decodeEntities(value: string | null): string | null {
	if (!value) return value;
	return cheerio.load(`<div>${value}</div>`)('div').text();
}

function firstString(value: unknown): string | null {
	if (typeof value === 'string') return value.trim() || null;
	if (Array.isArray(value)) return firstString(value[0]);
	return null;
}

function normalizeYield(value: unknown): string | null {
	if (typeof value === 'string') return value.trim() || null;
	if (typeof value === 'number') return String(value);
	if (Array.isArray(value)) return normalizeYield(value[0]);
	return null;
}

function normalizeIngredients(value: unknown): string {
	if (!Array.isArray(value)) return '';
	return value
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter(Boolean)
		.join('\n');
}

function normalizeInstructions(value: unknown): string {
	const lines: string[] = [];
	collectInstructions(value, lines);
	return lines.join('\n');
}

// recipeInstructions can be a plain string, an array of strings, an array of
// HowToStep objects ({ text }), or HowToSection objects that nest steps
// under itemListElement — real-world pages mix these shapes freely.
function collectInstructions(value: unknown, lines: string[]): void {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		if (trimmed) lines.push(trimmed);
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) collectInstructions(item, lines);
		return;
	}

	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		if (Array.isArray(obj.itemListElement)) {
			collectInstructions(obj.itemListElement, lines);
			return;
		}
		if (typeof obj.text === 'string') {
			const trimmed = obj.text.trim();
			if (trimmed) lines.push(trimmed);
		}
	}
}

function normalizeImage(value: unknown): string | null {
	if (typeof value === 'string') return value.trim() || null;
	if (Array.isArray(value)) return normalizeImage(value[0]);
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		if (typeof obj.url === 'string') return obj.url.trim() || null;
	}
	return null;
}
