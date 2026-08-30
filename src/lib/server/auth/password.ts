import bcrypt from 'bcryptjs';

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

/**
 * Password hashes contain literal `$` characters, which some env-var loaders
 * (Vite's dotenv-expand among them) misinterpret as shell-style variable
 * references and silently mangle. Storing the hash base64-encoded sidesteps
 * that across every environment (local dev, Render, etc).
 */
export function decodePasswordHash(base64Hash: string | undefined): string {
	if (!base64Hash) return '';
	return Buffer.from(base64Hash, 'base64').toString('utf8');
}
