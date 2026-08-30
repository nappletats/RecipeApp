import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function sign(value: string, secret: string): string {
	return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSessionToken(secret: string): string {
	const expiry = String(Date.now() + SESSION_DURATION_MS);
	return `${expiry}.${sign(expiry, secret)}`;
}

export function verifySessionToken(token: string | undefined, secret: string): boolean {
	if (!token || !secret) return false;

	const [expiry, sig] = token.split('.');
	if (!expiry || !sig) return false;

	const expected = sign(expiry, secret);
	const sigBuf = Buffer.from(sig);
	const expectedBuf = Buffer.from(expected);
	if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
		return false;
	}

	return Number(expiry) > Date.now();
}
