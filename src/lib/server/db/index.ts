import { drizzle } from 'drizzle-orm/libsql/http';
import { createClient } from '@libsql/client/http';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// The plain `@libsql/client` package pulls in the `libsql` native binding
// (for embedded-replica/local-file support), which Rollup can't bundle for
// an adapter-node production build — it does a dynamic require() to load a
// platform-specific .node file that the bundler can't statically resolve.
// This app only ever talks to a remote Turso database (never a local file),
// so the HTTP-only client sidesteps that native dependency entirely.
const client = createClient({ url: env.DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

export const db = drizzle(client, { schema });
