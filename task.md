# Dataset Showcase — Task Plan

> Derived from [PRD.md](./PRD.md). The PRD's 14 numbered sections are consolidated here into **3 build phases**, each ending with a complete verification gate before the next phase begins.

---

## PRD Section → Phase Mapping

| PRD Section | Title | Phase |
|---|---|---|
| §0 | Agent rules | All phases |
| §1 | Product summary | Reference |
| §2 | Scope | Reference |
| §3 | Tech stack | Phase 1 |
| §4 | Architecture | Phase 1 |
| §5 | Data model (SQL) | Phase 2 |
| §6 | API contract | Phase 2 |
| §7 | Key flows | Phase 2 + 3 |
| §8 | Client UI spec | Phase 1 |
| §9 | Admin UI spec | Phase 3 |
| §10 | Folder structure | Phase 1 |
| §11 | Security rules | Phase 2 + 3 |
| §12 | Milestones (M1–M5) | Phase 1 (M1), Phase 2 (M2–M3), Phase 3 (M4–M5) |
| §13 | Edge cases | Phase 2 + 3 |
| §14 | Definition of done | Phase 3 |

---

# Phase 1 — Foundation & Client UI
> **Goal**: Scaffold the project structure, implement the full public visitor UI, and verify it visually with local fixture data before touching any backend.
> Covers PRD §3, §4, §8, §10, §12 M1.

## Files to Create

```
src/
  lib/
    types.ts                   # All shared TypeScript types
    csv.ts                     # PapaParse helpers (type detection, stats)
  components/
    ArrowButton.tsx            # Round navigation arrow (<-  ->)
    Dots.tsx                   # Dot + "2 / 6" position indicator
    PropertiesList.tsx         # Key:value property renderer
    ColumnStats.tsx            # Stats strip (histogram / top-values)
    PreviewTable.tsx           # Sticky-header scrollable table card
    SlideView.tsx              # One full slide (title + props + table)
    Slider.tsx                 # Slider shell: keyboard, swipe, arrows
  app/
    page.tsx                   # Public page — uses Slider with fixture
    layout.tsx                 # Root layout, Montserrat font, metadata
    globals.css                # Tailwind base + custom variables
```

## Types (`src/lib/types.ts`)

```ts
export type ColumnType = "numeric" | "categorical" | "boolean" | "date" | "text";

export interface ColumnStats {
  min?: number; max?: number; mean?: number; bins?: number[];
  top?: { value: string; pct: number }[];
}

export interface Column {
  name: string;
  type: ColumnType;
  description?: string;
  stats?: ColumnStats;
}

export interface Property { key: string; value: string; }

export interface Dataset {
  id: string;
  title: string;
  description?: string;
  properties: Property[];
  columns: Column[];
  preview_rows: string[][];
  row_count: number;
  column_count: number;
  file_url?: string;
  file_path?: string;
  file_size_bytes?: number;
  position: number;
  created_at: string;
  updated_at: string;
}
```

## Fixture Data (TEMP — deleted in Phase 2)

- `src/lib/fixture.ts` — A file clearly marked `// TEMP: delete in Phase 2` with 2–3 sample Dataset objects.

## Client UI spec implementation

Follow PRD §8 exactly:
- Title: Montserrat bold, 28–32px desktop / 22px mobile.
- Properties: max-width 960px container, 2 columns if > 6 props.
- Preview card: light border, 8px radius, description banner, sticky header, max-height 420px, stats strip, footer "Showing first 20 of N rows".
- Arrows: 54px desktop, 44px tablet, moved below card on mobile.
- Transitions: 250ms fade/slide on slide change (title + props + table together).
- Keyboard: ←/→. Swipe on title+props area only (not on the table).
- Dots + "N / total" indicator.
- States: loading skeleton, empty state "No datasets yet", error state with Retry button.

## Phase 1 Checks & Tests

### ✅ Manual Visual Checks
- [ ] Desktop (≥1024px): arrows outside card, 54px, wrap-around works.
- [ ] Tablet (768–1023px): same layout, arrows 44px.
- [ ] Mobile (<768px): title 22px, arrows BELOW card with indicator between them.
- [ ] Keyboard navigation: ←/→ changes slide correctly.
- [ ] Swipe on title area changes slide; swipe on table does NOT.
- [ ] With 1 dataset: no arrows, no dots shown.
- [ ] With no datasets (empty fixture array): "No datasets yet" state shown.
- [ ] Loading skeleton visible briefly on first load.
- [ ] Stats strip: numeric shows mini histogram + min/max; categorical shows top-3 + %.
- [ ] Long cell text is truncated with ellipsis; hover `title` shows full text.

### ✅ Automated Lint/Type Checks
```bash
cd dataset-showcase
npm run lint
npx tsc --noEmit
```
**Expected**: zero errors, zero warnings.

### ✅ Build Check
```bash
npm run build
```
**Expected**: build succeeds with no type errors.

---

# Phase 2 — Database, API & Core Backend
> **Goal**: Wire in Supabase (Postgres + Storage), implement all API routes, connect the client page to live data, and implement the full admin auth + upload flow.
> Covers PRD §5, §6, §7, §11, §12 M2–M3, §13.

## Files to Create / Modify

```
src/
  lib/
    supabaseServer.ts          # Service-role client (server only)
    supabaseBrowser.ts         # Anon client (CSV direct upload)
    auth.ts                    # sign/verify session JWT (jose HS256)
  middleware.ts                # Protect /api/admin/* (except /login)
  app/
    api/
      datasets/
        route.ts               # GET /api/datasets
      admin/
        login/route.ts         # POST — password check, set cookie
        logout/route.ts        # POST — clear cookie
        me/route.ts            # GET — { authenticated: boolean }
        upload-url/route.ts    # POST — signed upload URL
        datasets/
          route.ts             # POST (create)
          [id]/route.ts        # PUT (update), DELETE
          reorder/route.ts     # POST (reorder)
    page.tsx                   # MODIFY: remove fixture, fetch /api/datasets
```

> **Delete** `src/lib/fixture.ts` (the TEMP file from Phase 1).

## SQL to Run in Supabase (PRD §5)

```sql
create table public.datasets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  properties jsonb not null default '[]',
  columns jsonb not null default '[]',
  preview_rows jsonb not null default '[]',
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
-- No public policies. Only service_role key can read/write.
```

## API Implementation Notes

- **`/api/datasets`**: `export const dynamic = "force-dynamic"`, `Cache-Control: no-store`.
- **`/api/admin/login`**: Constant-time compare with `ADMIN_PASSWORD`. 300ms delay on failure. Cookie: signed JWT, `httpOnly`, `sameSite=lax`, `secure` in prod, 12h expiry.
- **`/api/admin/upload-url`**: Validate filename extension (`.csv` only), sanitize name (alphanumeric + dash/underscore/dot), return `{ path, token }`.
- **`/api/admin/datasets` POST**: Validate JSON shape server-side (title required, jsonb fields are arrays). Compute `position = max(position) + 1`.
- **`/api/admin/datasets/[id]` PUT**: If new `file_path` provided, delete old file from Storage.
- **`/api/admin/datasets/[id]` DELETE**: Delete DB row AND Storage file in one operation.
- **`/api/admin/datasets/reorder` POST**: Validate `ids` is a non-empty string array; update `position` field in order.

## Security Implementation (PRD §11)

- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` — server-only env vars, never in `NEXT_PUBLIC_*`.
- Middleware verifies JWT on every `/api/admin/*` route except `/api/admin/login`.
- Filenames sanitized: `filename.replace(/[^a-zA-Z0-9._-]/g, '_')`.
- String lengths server-side: `title` max 200 chars, `description` max 5000 chars.
- All JSON response shapes validated with simple shape checks (no external schema library needed).
- Preview cell values truncated to 200 chars. `preview_rows` kept under 200 KB total.
- No `dangerouslySetInnerHTML` anywhere in the codebase.

## Edge Cases to Handle (PRD §13)

| Case | Handler |
|---|---|
| Empty CSV or header-only | Show "CSV has no data rows" error in dropzone |
| Duplicate/blank column names | Rename: `col`, `col_2`, `col_3` |
| UTF-8 BOM | PapaParse handles automatically |
| Different delimiters | PapaParse `delimiter: ""` (auto-detect) |
| File > 50 MB | Reject client-side before upload attempt |
| Non-CSV file | Reject by extension check before upload |
| Upload succeeds, save fails | Call Storage delete to clean up orphaned file |
| Save succeeds, upload failed | The row will have no `file_path`; show warning in admin |
| Very wide files (100+ cols) | Compute stats for first 50 cols only; horizontal scroll |
| Only 1 dataset | Hide arrows and dots |
| No description/no properties | Hide section entirely |

## Phase 2 Checks & Tests

### ✅ Database Verification
- [ ] SQL schema applied in Supabase. Table `datasets` visible in Table Editor.
- [ ] RLS enabled, no policies — direct anon-key query returns empty (not data).
- [ ] Manually insert a row in Supabase Table Editor → `GET /api/datasets` returns it.

### ✅ API Route Tests (curl / browser)
```bash
# Should return 401 without cookie
curl -X GET http://localhost:3000/api/admin/me

# Login (replace password)
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}' -c cookies.txt

# Should return { authenticated: true }
curl http://localhost:3000/api/admin/me -b cookies.txt

# Wrong password should return 401 (after ~300ms delay)
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'
```

### ✅ Security Checks
- [ ] Open browser devtools → Network → No response body contains `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_PASSWORD`.
- [ ] `GET /api/admin/me` without cookie returns `{ authenticated: false }` (401).
- [ ] Non-CSV file upload attempt returns a clear error message.
- [ ] File > 50 MB is rejected before the upload begins.
- [ ] Orphan cleanup: simulate upload-success/save-failure and verify Storage file is deleted.

### ✅ Automated Lint/Type Checks
```bash
npm run lint
npx tsc --noEmit
```
**Expected**: zero errors, zero warnings.

### ✅ Build Check
```bash
npm run build
```
**Expected**: build succeeds. No client-side import of `supabaseServer.ts` or `auth.ts` (server-only modules).

---

# Phase 3 — Admin UI, Polish & Deployment
> **Goal**: Build the full admin dashboard, implement all polish items (stats strip, auto-refresh, download link, a11y), write the README, and deploy to Vercel.
> Covers PRD §9, §12 M4–M5, §14.

## Files to Create / Modify

```
src/
  components/
    admin/
      LoginForm.tsx            # Password field + Log in button + inline error
      DatasetList.tsx          # List with Edit/Delete/Move up/Move down/New
      DatasetForm.tsx          # Full form: dropzone, fields, props editor, cols editor
      CsvDropzone.tsx          # Drag-and-drop + click, .csv only, 50 MB limit
      PropertiesEditor.tsx     # Add/remove key:value rows, pre-filled auto values
      ColumnsEditor.tsx        # Per-column description input, type shown read-only
  app/
    admin/
      page.tsx                 # Login + dashboard switcher
    page.tsx                   # MODIFY: add focus-refetch + 60s interval refetch
```

## Admin UI Implementation (PRD §9)

- **Login screen**: password field + Log In button. Error shown inline (not alert). No admin URL visible on public page.
- **Dashboard (two panels, stacked on mobile)**:
  - Left panel — Dataset list: title, rows count, columns count. Buttons: Edit, Delete (confirm dialog), Move Up, Move Down, New Dataset. Logout + "View site" link at top.
  - Right panel — Dataset form (see below).
- **CSV Dropzone**: drag-and-drop + click-to-browse. Accept `.csv` only. Max 50 MB. Show file name + size after selection. Clear error messages for invalid files.
- **Form fields**: Title (input, required), Description (textarea).
- **Properties editor**: list of key/value rows. Add row, remove row (×). Pre-filled: `Rows`, `Columns`, `File size`.
- **Column table**: detected name + type (read-only). Editable description input per column.
- **Live mini preview**: first 5 rows shown in a small table below the dropzone.
- **Save button**: loading state while uploading + saving. Success toast "Dataset saved." Error toast with message.
- **Edit mode**: load existing data without requiring CSV re-upload. Re-uploading replaces file and detected data.

## Polish Items (PRD §12 M4)

- **Stats strip** (if not done in Phase 1): numeric → tiny histogram with min/max labels; categorical/boolean → top 3 values with percentage bars.
- **Download CSV link**: below the preview card, uses `file_url`. Hidden if `file_url` is null.
- **Auto-refresh** on the public page:
  ```ts
  // Refetch on tab focus
  useEffect(() => {
    window.addEventListener("focus", refetch);
    return () => window.removeEventListener("focus", refetch);
  }, []);
  // Refetch every 60 seconds
  useEffect(() => {
    const id = setInterval(refetch, 60_000);
    return () => clearInterval(id);
  }, []);
  ```
- **Accessibility pass**:
  - All arrow buttons: `aria-label="Previous dataset"` / `aria-label="Next dataset"`.
  - Visible focus rings on all interactive elements (Tailwind `focus-visible:ring-2`).
  - Color contrast ≥ 4.5:1 for all text.
  - Table `<th>` elements have `scope="col"`.
  - Form inputs have associated `<label>` elements.
  - Delete confirm dialog: focus trapped, `role="alertdialog"`.

## README

`dataset-showcase/README.md` must contain:
- Project description (one paragraph).
- Setup instructions (clone, install, env vars, run).
- Full list of required env vars with descriptions.
- How to run the SQL schema in Supabase.
- How to add a dataset (visit `/admin`, upload CSV, fill form, Save).
- Deployment instructions (Vercel env vars, link to Vercel dashboard).

## Phase 3 Checks & Tests

### ✅ Admin End-to-End Checks
- [ ] Login with correct password → dashboard appears.
- [ ] Login with wrong password → inline error, no redirect.
- [ ] Upload a CSV → auto-fills title, rows, columns, file size in form.
- [ ] Save → dataset appears in list and on public `/` page.
- [ ] Edit a dataset without re-uploading → changes saved, CSV unchanged.
- [ ] Re-upload replaces file; old file removed from Storage.
- [ ] Delete → confirm dialog; after confirm: row gone from list AND file deleted from Storage.
- [ ] Reorder (Move Up / Move Down) → public page shows new order.
- [ ] Logout → cannot access admin API routes.

### ✅ Public Page Polish Checks
- [ ] Auto-refresh: make an admin change → public tab updates within 60s without manual reload.
- [ ] Focus-refresh: switch tab away, make admin change, switch back → public tab updates.
- [ ] Download CSV link appears and downloads the file correctly.
- [ ] Stats strip correct for numeric columns (histogram visible with min/max).
- [ ] Stats strip correct for categorical columns (top 3 values with %).

### ✅ Accessibility Checks
- [ ] Tab through all interactive elements — focus ring visible on every element.
- [ ] Screen reader: arrow buttons have meaningful `aria-label`.
- [ ] Delete dialog: focus moves to dialog on open; Escape closes it.
- [ ] Run Lighthouse accessibility audit → score ≥ 90.

### ✅ Definition of Done (PRD §14)
- [ ] Visitors see admin changes without a redeploy (auto-refresh works).
- [ ] `/admin` returns 401 / redirects without valid cookie.
- [ ] No secrets in browser bundle (devtools → Sources, search for `service_role`).
- [ ] Looks clean on phone, tablet, and laptop.
- [ ] Deployed on Vercel with production env vars set.
- [ ] README explains setup, env vars, and how to add a dataset.
- [ ] Test on a second device (phone or second laptop).

### ✅ Production Build Check
```bash
npm run build
npm run start
# Then run all manual checks above against the production build on localhost:3000
```

### ✅ Night-Before Checklist (PRD §1, Section 7)
- [ ] Wake up Supabase project by opening dashboard.
- [ ] Upload 3–5 real datasets from `/admin`.
- [ ] Open public URL on a second device (phone/tablet).
- [ ] Verify slides, arrows, and table horizontal scroll.
- [ ] Keep local backup: `npm run dev` works offline.

---

# Summary: Phase Gate Criteria

| Phase | Gate Condition |
|---|---|
| **Phase 1 → Phase 2** | `npm run lint` + `npx tsc --noEmit` + `npm run build` all pass. All visual checks in Phase 1 list confirmed. |
| **Phase 2 → Phase 3** | All curl API tests pass. Security checks pass. Build passes. Supabase DB row appears on public `/` page. |
| **Phase 3 → Done** | All admin E2E checks pass. Lighthouse a11y ≥ 90. Production build passes. Deployed to Vercel. Tested on second device. |
