# Dataset Showcase: Setup Guide + PRD

A public, slider-style site that presents CSV datasets, plus a password-protected `/admin` page where I upload and manage them. Whatever I save in admin shows up for every visitor.

- **Part 1**: setup steps for me (the human).
- **Part 2**: instructions + PRD for the coding agent.

---

# Part 1: Project setup (for me)

## 1. Accounts and tools
- Node.js 20+, Git
- Accounts: GitHub, Vercel, Supabase (all free)

## 2. Create the project
```bash
npx create-next-app@latest dataset-showcase --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd dataset-showcase
npm i @supabase/supabase-js papaparse jose lucide-react
npm i -D @types/papaparse
```
Copy this `PRD.md` into the project root.

## 3. Set up Supabase
1. Create a new project at supabase.com. Save the database password somewhere.
2. Open **SQL Editor**, paste the SQL from Part 2, section 5, and run it.
3. Open **Storage**, create a bucket named `datasets`, turn **Public bucket** ON, set file size limit to 50 MB.
4. Open **Project Settings → API** and copy: Project URL, `anon` key, `service_role` key.

## 4. Environment variables
Create `.env.local` in the project root (it is already git-ignored):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=choose-a-strong-password
SESSION_SECRET=...        # generate with: openssl rand -base64 32
```
Never put the service role key in a variable starting with `NEXT_PUBLIC_`.

## 5. Hand it to the agent
Open the project in your coding agent and say:

> Read PRD.md. Follow Part 2 exactly and build it milestone by milestone. Stop after each milestone so I can check it.

## 6. Deploy on Vercel
1. `git init`, commit, push to a new GitHub repo.
2. In Vercel: **Add New → Project → import the repo**.
3. Add the same 5 environment variables in Vercel project settings.
4. Deploy. Every `git push` redeploys automatically.

## 7. Night-before checklist
- Open your Supabase dashboard once so the free project is awake (free projects pause after about a week of no use).
- Upload 3 to 5 real datasets from the deployed `/admin`.
- Open the public link on a second laptop and a phone. Check slides, arrows, and table scrolling.
- Keep a backup: screenshots of the working site and the project running locally with `npm run dev`.

---

# Part 2: Instructions for the coding agent + PRD

## 0. Rules for the agent
- Read this whole part before writing code.
- Build in the milestone order in section 12. After each milestone, run the app, check the acceptance criteria, then stop and report.
- Do not hardcode datasets. All content comes from Supabase. A temporary local fixture is allowed in Milestone 1 only and must be deleted in Milestone 3.
- The UI must match the draft described in section 8 (centered title, Properties list, preview table card, round grey arrows on both sides).
- Keep the code simple and readable. No extra libraries beyond the ones listed in section 3 unless truly needed.
- Make sensible decisions yourself. Write any assumption in `README.md`.
- Security rules are in section 11. They are not optional.

## 1. Product summary
A two-sided web app:
- **Client side (`/`)**: public, read-only. Shows one dataset at a time as a "slide". Arrows, keyboard, and swipe move between datasets. Title, properties, and preview table all change together.
- **Admin side (`/admin`)**: password-protected. Upload a CSV, fill in details, save, edit, delete, reorder.
- Changes made in admin are visible to all visitors without redeploying.

Goal: look clean, professional, and reliable in a live presentation. Works on laptops, tablets, and phones.

## 2. Scope
**In scope (v1):** CSV only, one admin password, create/edit/delete/reorder datasets, auto-detected stats, preview table, responsive layout, deployment on Vercel.

**Out of scope:** user accounts, multiple admins, other file types (xlsx, json), charts beyond the small column stats, comments, search, analytics.

## 3. Tech stack
- Next.js (App Router) + TypeScript
- Tailwind CSS (use the version `create-next-app` installed)
- Supabase: Postgres (details) + Storage (CSV files), accessed with `@supabase/supabase-js`
- PapaParse: CSV parsing in the browser
- jose: signing and verifying the admin session cookie
- lucide-react: icons
- Fonts via `next/font/google`: **Montserrat** for UI, a monospace font (JetBrains Mono or `ui-monospace`) for table cells
- Hosting: Vercel

## 4. Architecture

```
 Visitor browser  (/)               Admin browser  (/admin)
        |                                   |
        | GET /api/datasets                 | POST /api/admin/login   -> session cookie
        |                                   | POST /api/admin/upload-url
        |                                   | POST/PUT/DELETE /api/admin/datasets
        v                                   v
 ---------------- Next.js on Vercel (pages + route handlers) ----------------
                  |                                      |
         Supabase Postgres                       Supabase Storage
         table: datasets                         bucket: datasets (CSV files)
                                                          ^
        Admin browser uploads the CSV directly to Storage using a signed upload URL
```

Why these choices:
- All database access goes through server route handlers. The browser never talks to the database directly.
- The CSV is parsed **in the admin's browser** (rows, columns, types, stats, first 20 rows). Only small JSON goes to the API.
- The CSV file itself goes straight to Supabase Storage via a signed upload URL, because Vercel limits request bodies to about 4.5 MB.
- The client page only loads small JSON (metadata + 20 preview rows), so it is fast and never downloads the full CSV.

## 5. Data model

Run in Supabase SQL Editor:

```sql
create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  properties jsonb not null default '[]',    -- [{ "key": "Rows", "value": "45,211" }, ...]
  columns jsonb not null default '[]',       -- [{ name, type, description, stats }]
  preview_rows jsonb not null default '[]',  -- first 20 rows, array of arrays of strings
  row_count integer not null default 0,
  column_count integer not null default 0,
  file_path text,
  file_url text,
  file_size_bytes bigint,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.datasets enable row level security;
-- No policies on purpose: the anon key can read/write nothing.
-- Only server code using the service role key touches this table.
```

`columns[]` item shape:
```ts
{
  name: string,
  type: "numeric" | "categorical" | "boolean" | "date" | "text",
  description: string,               // optional, filled in by admin
  stats?: {
    // numeric
    min?: number, max?: number, mean?: number, bins?: number[],
    // categorical / boolean
    top?: { value: string, pct: number }[]   // top 3 values + percentage
  }
}
```

`properties` is a free list of key/value pairs. In the admin form it is pre-filled with auto values (Rows, Columns, File size) and the admin can edit, remove, or add more (for example Source, Target column, Domain).

## 6. API contract

All responses are JSON. Admin routes return `401` without a valid session cookie.

**Public**
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/datasets` | All datasets ordered by `position`. Must send `Cache-Control: no-store` and use `export const dynamic = "force-dynamic"` so new data always shows. |

**Admin**
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/admin/login` | Body `{ password }`. Compare with `ADMIN_PASSWORD` using a constant-time compare. On success set cookie `admin_session`. Add a small delay on failure. |
| POST | `/api/admin/logout` | Clears the cookie. |
| GET | `/api/admin/me` | Returns `{ authenticated: boolean }`. |
| POST | `/api/admin/upload-url` | Body `{ filename }`. Creates a signed upload URL in the `datasets` bucket with a unique, sanitized path. Returns `{ path, token }`. |
| POST | `/api/admin/datasets` | Create a dataset. Computes `position` as last + 1 and `file_url` from the storage path. |
| PUT | `/api/admin/datasets/[id]` | Partial update. If the CSV was replaced, delete the old file from Storage. |
| DELETE | `/api/admin/datasets/[id]` | Delete the row and its file in Storage. |
| POST | `/api/admin/datasets/reorder` | Body `{ ids: string[] }`. Rewrites `position` in that order. |

Session cookie: signed JWT (jose, HS256, `SESSION_SECRET`), `httpOnly`, `sameSite=lax`, `secure` in production, 12 hour expiry. Verify it in every admin route handler (and in middleware for `/api/admin/*` except `login`).

## 7. Key flows

**Create a dataset (admin)**
1. Admin logs in at `/admin`.
2. Drops a `.csv` file. Browser parses it with PapaParse in streaming mode: counts rows, reads headers, keeps the first 20 rows, detects column types, and computes stats on up to the first 10,000 rows.
3. Form auto-fills: Title (from file name), Rows, Columns, File size, and the column list.
4. Admin edits the title, description, properties, and optional column descriptions.
5. On Save: browser calls `/api/admin/upload-url`, uploads the CSV straight to Storage, then calls `POST /api/admin/datasets` with the metadata JSON.
6. Dataset appears in the admin list and on the public site.

**View (client)**
1. `/` calls `GET /api/datasets`.
2. Shows the first dataset. Arrows, keyboard, and swipe change the index with wrap-around.
3. The page refetches when the tab regains focus and every 60 seconds, so admin changes show up without a manual reload.

## 8. Client UI spec (based on the draft image)

**Look:** white background, black text, light grey borders, one subtle accent colour (teal, around `#0E7490`) used only for small highlights. No heavy shadows. Clean and quiet.

**Desktop layout (top to bottom), one slide:**
1. **Title**: centered, Montserrat bold, 28 to 32px.
2. **"Properties"**: bold heading, left-aligned inside a container of max width about 960px. Under it, one line per property: `key: value` (key in semi-bold, value regular). If there are more than 6 properties, use two columns.
3. **Preview card** (the table):
   - Light border, 8px radius.
   - **Description banner** at the top of the card, light grey, showing `description`.
   - **Table** with a sticky header and a max height of about 420px (vertical scroll inside the card; horizontal scroll if many columns).
   - **Header cell**: column name, small type badge, and the column description in small grey text.
   - **Stats strip** under the header (P1): for categorical/boolean columns show the top 3 values with percentages; for numeric columns show a tiny histogram with min and max. Same idea as the draft.
   - **Body cells**: monospace, small, thin row borders, long text truncated with ellipsis and the full text in a `title` tooltip.
   - Footer line: `Showing first 20 of 45,211 rows`.
4. **Download CSV** link under the card (P1) using `file_url`.
5. **Position indicator**: dots plus `2 / 6`.

**Arrows:** two round buttons (about 54px, fill `#D9D9D9`, darker on hover, thin chevron icon) placed outside the card, left and right, vertically centered on the card. Wrap around at the ends. Visible focus ring. `aria-label`s "Previous dataset" and "Next dataset".

**Interaction:**
- Keyboard: `←` and `→`.
- Touch: swipe left/right on the title and properties area. Do **not** capture swipes on the table, so the table can scroll sideways.
- Transition: about 250ms fade/slide. The title, properties, and table must change together as one slide.

**Responsive:**
| Width | Behaviour |
|---|---|
| ≥ 1024px | Layout above. Arrows outside the card at 54px. |
| 768 to 1023px | Same, arrows 44px, container uses full width with padding. |
| < 768px | Title 22px. Properties stacked. Card is full width. Arrows move to a row **below** the card (44px circles) with the `2 / 6` indicator between them. |

**States:** loading skeleton, empty state ("No datasets yet" with no link to admin), error state with a Retry button. Never show the admin URL on the public page.

## 9. Admin UI spec

Same fonts and colours as the client side, simple and tidy.

- **Login screen**: password field and Log in button. Wrong password shows an inline error.
- **After login, two panels** (stacked on mobile):
  - **Dataset list**: title, rows, columns. Buttons: Edit, Delete (with confirm dialog), Move up, Move down. "New dataset" button. Logout button. "View site" link.
  - **Form**:
    - CSV drop zone (click or drag). Accept only `.csv`, max 50 MB, with clear error messages.
    - Title, Description (textarea).
    - Properties editor: list of key/value rows with add and remove. Pre-filled with Rows, Columns, File size.
    - Column table: detected name and type (read-only) plus an editable description input per column.
    - Live mini preview of the first rows.
    - Save button with a loading state, then a success or error toast.
- Edit mode works without re-uploading the CSV. Re-uploading is optional and replaces the file and the detected data.

## 10. Suggested folder structure
```
src/
  app/
    page.tsx                      # client slider page
    admin/page.tsx                # admin page (login + dashboard)
    api/
      datasets/route.ts
      admin/
        login/route.ts
        logout/route.ts
        me/route.ts
        upload-url/route.ts
        datasets/route.ts
        datasets/[id]/route.ts
        datasets/reorder/route.ts
  components/
    Slider.tsx  SlideView.tsx  PropertiesList.tsx
    PreviewTable.tsx  ColumnStats.tsx  ArrowButton.tsx  Dots.tsx
    admin/  LoginForm.tsx  DatasetList.tsx  DatasetForm.tsx
            CsvDropzone.tsx  PropertiesEditor.tsx  ColumnsEditor.tsx
  lib/
    supabaseServer.ts             # service-role client (server only)
    supabaseBrowser.ts            # anon client (uploads only)
    auth.ts                       # sign/verify session JWT
    csv.ts                        # PapaParse parsing, type detection, stats
    types.ts
  middleware.ts
```

## 11. Security rules (must follow)
- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` are server-only. Never import them in client components.
- RLS stays enabled with no public policies.
- Storage writes only happen through signed upload URLs created by the server after the admin session is verified.
- Validate on the server: file extension `.csv`, filename sanitized, string lengths capped, JSON shapes checked.
- Render all CSV content as plain text (no `dangerouslySetInnerHTML`).
- Truncate preview cell values to 200 characters and keep `preview_rows` under about 200 KB.

## 12. Milestones and acceptance criteria

**Milestone 1: Client UI with a temporary fixture**
- Slider page built from a local sample list (flagged `TEMP`, to be deleted in M3).
- Matches the draft: title, Properties, preview card, round arrows, indicator.
- Keyboard and swipe work. Responsive at 3 breakpoints.
- *Accept:* arrows change title, properties, and table together; mobile layout puts arrows below the card.

**Milestone 2: Database and public API**
- Supabase clients, schema in place, `GET /api/datasets`.
- Client page loads from the API with loading, empty, and error states.
- *Accept:* a row inserted manually in Supabase appears on the site after refresh.

**Milestone 3: Admin**
- Login/logout with the signed cookie, middleware protection.
- CSV parsing, type detection, stats, direct upload to Storage.
- Create, edit, delete, reorder. Remove the temporary fixture.
- *Accept:* upload a CSV in `/admin`, open `/` in another browser, and see it. Delete removes the row and the file. Wrong password and logged-out API calls are rejected.

**Milestone 4: Polish**
- Column stats strip, Download CSV link, auto refresh on focus and every 60s.
- Accessibility pass (focus rings, labels, contrast).
- *Accept:* edits in admin appear on the client within about a minute without reload.

**Milestone 5: Deploy and verify**
- README with setup and env var list.
- Works on Vercel with the production env vars.
- *Accept:* run the night-before checklist from Part 1 on the live URL.

## 13. Edge cases to handle
- Empty CSV, header-only CSV, or file with no header row (show a clear error).
- Duplicate or blank column names (rename like `col`, `col_2`).
- UTF-8 BOM, different delimiters (let PapaParse auto-detect), quoted newlines.
- Very wide files (100+ columns): table scrolls horizontally, compute stats for the first 50 columns only.
- Files over 50 MB or non-CSV files: reject with a friendly message.
- Upload succeeds but saving fails (or the reverse): clean up the orphaned file or row.
- Only one dataset: hide arrows and dots.
- Dataset with no description or no properties: hide that section instead of showing empty space.

## 14. Definition of done
- Visitors see admin changes without a redeploy.
- `/admin` is unusable without the password, and no secret appears in the browser bundle.
- Looks clean and works on a phone, a tablet, and a laptop.
- Deployed on Vercel and tested on a second device.
- README explains setup, env vars, and how to add a dataset.