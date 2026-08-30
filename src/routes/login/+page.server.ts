import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { verifyPassword, decodePasswordHash } from '$lib/server/auth/password';
import { createSessionToken } from '$lib/server/auth/session';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.authed) redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');

		if (!password) {
			return fail(400, { error: 'Enter your password' });
		}
		if (!env.APP_PASSWORD_HASH_B64 || !env.SESSION_SECRET) {
			return fail(500, { error: 'Server is not configured (missing env vars)' });
		}

		const valid = await verifyPassword(password, decodePasswordHash(env.APP_PASSWORD_HASH_B64));
		if (!valid) {
			return fail(400, { error: 'Incorrect password' });
		}

		cookies.set('session', createSessionToken(env.SESSION_SECRET), {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(303, url.searchParams.get('redirectTo') || '/');
	}
};
