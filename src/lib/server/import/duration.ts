const ISO_DURATION = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

export function parseIsoDurationToMinutes(value: unknown): number | null {
	if (typeof value !== 'string') return null;

	const match = ISO_DURATION.exec(value.trim());
	if (!match) return null;

	const hours = Number(match[1] ?? 0);
	const minutes = Number(match[2] ?? 0);
	const total = hours * 60 + minutes;
	return total > 0 ? total : null;
}
