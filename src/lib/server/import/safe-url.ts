// Basic SSRF guard for the URL-import feature: this app is single-user and
// password-gated, but a pasted URL still gets fetched server-side, so block
// the obvious ways it could be pointed at internal/local network targets.
export function isSafeImportUrl(url: URL): boolean {
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

	const hostname = url.hostname.toLowerCase();
	if (hostname === 'localhost' || hostname.endsWith('.localhost')) return false;
	if (hostname === '0.0.0.0' || hostname === '::1' || hostname === '169.254.169.254') {
		return false;
	}

	const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (ipv4) {
		const [a, b] = ipv4.slice(1).map(Number);
		if (a === 127) return false; // loopback
		if (a === 10) return false; // private
		if (a === 172 && b >= 16 && b <= 31) return false; // private
		if (a === 192 && b === 168) return false; // private
		if (a === 169 && b === 254) return false; // link-local
	}

	return true;
}
