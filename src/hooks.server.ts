import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { verifySessionToken } from '$lib/server/auth/session';

const PUBLIC_PATHS = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
	const isPublicPath = PUBLIC_PATHS.some((path) => event.url.pathname.startsWith(path));
	const token = event.cookies.get('session');
	const authed = verifySessionToken(token, env.SESSION_SECRET ?? '');

	event.locals.authed = authed;

	if (!authed && !isPublicPath) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	if (authed && event.url.pathname === '/login') {
		redirect(303, '/');
	}

	return resolve(event);
};
