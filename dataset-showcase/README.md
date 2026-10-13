# Dataset Showcase

A public, slider-style site that presents CSV datasets — one dataset per slide with its properties and a scrollable preview table — plus an `/admin` page where an admin uploads and manages datasets. Anything saved in admin appears for every visitor within about a minute, without redeploying.

## Setup

```bash
git clone <your-repo-url>
cd dataset-showcase
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Supabase project URL (public, used by browser + server). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Anon key (public). Used only for direct CSV uploads to signed URLs; it cannot read the database (RLS has no public policies). |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | Service-role key (**server only**, never `NEXT_PUBLIC_*`). All database and Storage admin access goes through API routes using this key. |

## Database & Storage (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase-schema.sql` from this repo, and run it. This creates the `datasets` table (RLS enabled, no public policies) and a public-read policy for the bucket.
3. Open **Storage**, create a bucket named `datasets`, turn **Public bucket** ON, and set the file size limit to 50 MB.

## How to add a dataset

1. Visit `/admin`.
2. Click **New dataset**, drop a `.csv` file (max 50 MB) onto the dropzone or click to browse.
3. The form auto-fills the title (from the file name), Rows/Columns/File-size properties, the detected column list with types and stats, and a 5-row preview.
4. Edit the title, description, properties, and per-column descriptions, then **Save dataset**.
5. The dataset appears in the admin list and on the public `/` page (auto-refreshes within 60 s).
6. Existing datasets can be edited without re-uploading; re-uploading replaces the file and detected data (the old file is deleted). Use ↑/↓ to reorder and **Delete** (with confirmation) to remove a dataset and its file.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In the [Vercel dashboard](https://vercel.com/dashboard): **Add New → Project → Import** the repo.
3. Add the same three environment variables in **Project Settings → Environment Variables**.
4. Deploy. Every `git push` redeploys automatically; content changes via `/admin` need no redeploy.

## Scripts

- `npm run dev` — local development
- `npm run lint` / `npx tsc --noEmit` — must pass with zero errors/warnings
- `npm run build` / `npm run start` — production build and serve

## Assumptions

- No authentication on `/admin` (single-user assignment); all admin API routes are open.
- CSV only (`.csv` extension, 50 MB max, first 20 rows previewed, stats from up to 10,000 rows / 50 columns).
- Proxy/boundary note: Next.js 16 renamed `middleware.ts` to `src/proxy.ts`, and forbids the legacy `export const dynamic = "force-dynamic"` under Cache Components — `/api/datasets` uses `await connection()` plus `Cache-Control: no-store` instead.
- Fonts are vendored in `src/app/fonts/` and loaded with `next/font/local` (variable Montserrat + JetBrains Mono, latin subset). `next/font/google` is intentionally not used — its Turbopack loader fails the Vercel production build.

