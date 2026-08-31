import { createWorker } from 'tesseract.js';

const OCR_TIMEOUT_MS = 60_000;

// Returns raw extracted text only — no structuring into ingredients/steps.
// Tesseract can't reliably tell the two apart, so the review step (the
// recipe form shown after scanning) is where the user does that split.
export async function extractTextFromImage(image: Buffer): Promise<string> {
	const worker = await createWorker('eng');
	try {
		const recognize = worker.recognize(image);
		const timeout = new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error('OCR took too long — try a smaller or clearer photo')),
				OCR_TIMEOUT_MS
			);
		});

		const {
			data: { text }
		} = await Promise.race([recognize, timeout]);
		return text.trim();
	} finally {
		// Always terminate, whether recognize() finished, threw, or the race
		// timed out — an orphaned worker would otherwise keep running server-side.
		await worker.terminate();
	}
}
