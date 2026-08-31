import { createWorker } from 'tesseract.js';

// Returns raw extracted text only — no structuring into ingredients/steps.
// Tesseract can't reliably tell the two apart, so the review step (the
// recipe form shown after scanning) is where the user does that split.
export async function extractTextFromImage(image: Buffer): Promise<string> {
	const worker = await createWorker('eng');
	try {
		const {
			data: { text }
		} = await worker.recognize(image);
		return text.trim();
	} finally {
		await worker.terminate();
	}
}
