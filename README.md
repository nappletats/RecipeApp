# Recipes

A personal recipe manager: capture recipes from cookbooks and the web, search everything at once, and log notes/adjustments each time you cook something.

## Local development

```bash
npm install
npm run db:migrate   # creates local.db and applies schema + FTS5 search index
npm run dev
```

On Windows PowerShell, if you hit `running scripts is disabled on this system`, use `npm.cmd` instead of `npm` for these commands (PowerShell blocks `npm`'s `.ps1` wrapper by default).

Visit `http://localhost:5173`. Local auth credentials are already set in `.env` (gitignored) — see the comment above `APP_PASSWORD_HASH_B64` if you want to change the password.

## Deploying (cloud-hosted, reachable from your phone)

This app is designed to run on **Render** (free web service) with the database on **Turso** (free hosted SQLite). Both require accounts I can't create on your behalf — here's what to do:

### 1. Create a Turso database

1. Sign up at [turso.tech](https://turso.tech) (free tier).
2. Install their CLI or use the dashboard to create a new database.
3. From the dashboard, grab:
   - The database URL (looks like `libsql://your-db-name.turso.io`)
   - An auth token
4. Set both as separate variables — `DATABASE_URL` and `TURSO_AUTH_TOKEN` — wherever you're running the app (locally in `.env`, or in Render's environment variables for production). They're read separately, not combined into one string.

### 2. Apply the schema to Turso

With `.env`'s `DATABASE_URL`/`TURSO_AUTH_TOKEN` pointed at your Turso database, run:

```bash
npm.cmd run db:migrate
```

(On Windows PowerShell, `npm` itself is a blocked `.ps1` script by default — use `npm.cmd` instead of `npm` for any npm command, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once to allow it permanently.)

This creates all tables, including the FTS5 search index, on the remote database.

### 3. Generate production auth credentials

Don't reuse the local dev password. Generate a real one:

```bash
node -e "console.log(Buffer.from(require('bcryptjs').hashSync('YOUR-REAL-PASSWORD', 12)).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep the plaintext password somewhere safe (a password manager) — only the hash goes into the app.

### 4. Deploy to Render

1. Push this project to your GitHub repo (Render deploys from git).
2. In Render, **New +** → **Web Service** → connect that GitHub repo.
3. Build command: `npm install && npm run build`
4. Start command: `node build`
5. Add environment variables in Render's dashboard (**Environment** tab):
   - `DATABASE_URL` — your Turso database URL
   - `TURSO_AUTH_TOKEN` — your Turso auth token
   - `APP_PASSWORD_HASH_B64` — from step 3
   - `SESSION_SECRET` — from step 3
6. Deploy. Render gives you a `https://your-app.onrender.com` URL.

(Uses `@sveltejs/adapter-node`, already configured in `vite.config.ts` — Render has no adapter-auto detection, so this is pinned explicitly.)

### 5. Install on your phone

Open the Render URL on your phone's browser, log in, then use "Add to Home Screen" (once PWA support is added in a later phase) or just bookmark it — either way it's reachable from anywhere, not just home wifi.

## Project structure

See [.claude/plans](.claude/plans) for the original implementation plan, or skim `src/lib/server/` — `db/schema.ts` (data model), `db/search.ts` (FTS5 sync/query), `recipes.ts` (create/update/delete), `auth/` (password gate).
