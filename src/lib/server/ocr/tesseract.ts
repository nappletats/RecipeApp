import { createWorker } from 'tesseract.js';

const OCR_TIMEOUT_MS = 60_000;

// Returns raw extracted text only — no structuring into ingredients/steps.
// Tesseract can't reliably tell the two apart, so the review step (the
// recipe form shown after scanning) is where the user does that split.
export async function extractTextFromImage(image: Buffer): Promise<string> {
	// Without an errorHandler, tesseract.js's internal message handler does
	// `throw Error(data)` synchronously on any worker-side failure (e.g. an
	// unreadable/corrupt image) — that throw happens outside any promise
	// chain, so it's an uncaught exception that crashes the entire Node
	// process, not just this request. The corresponding recognize() promise
	// rejection (caught below) is what actually carries the error to the
	// caller; this just needs to exist to suppress the crash-inducing default.
	const worker = await createWorker('eng', undefined, { errorHandler: () => {} });
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
		// Bounded, not awaited-forever: if recognize() was mid-computation
		// when the race timed out, terminate() on that same stuck worker can
		// itself hang — which would block this response indefinitely even
		// though the timeout above "won". Give it a few seconds, then move on
		// regardless so the HTTP response always actually gets sent.
		void Promise.race([
			worker.terminate(),
			new Promise((resolve) => setTimeout(resolve, 5000))
		]);
	}
}
