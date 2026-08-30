import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { recipes } from '$lib/server/db/schema';

// Temporary diagnostic route — reports env var presence and the raw DB
// error, since Render's log viewer isn't showing live output. Remove once
// the production 500 is diagnosed.
export async function GET() {
	const report: Record<string, unknown> = {
		databaseUrlSet: Boolean(env.DATABASE_URL),
		databaseUrlPrefix: env.DATABASE_URL?.slice(0, 20) ?? null,
		authTokenSet: Boolean(env.TURSO_AUTH_TOKEN),
		authTokenLength: env.TURSO_AUTH_TOKEN?.length ?? 0
	};

	try {
		const rows = await db.select().from(recipes);
		report.queryOk = true;
		report.rowCount = rows.length;
	} catch (err) {
		report.queryOk = false;
		report.errorMessage = err instanceof Error ? err.message : String(err);
		report.errorName = err instanceof Error ? err.name : null;
		report.errorCause =
			err instanceof Error && err.cause instanceof Error ? err.cause.message : null;
	}

	return json(report);
}
