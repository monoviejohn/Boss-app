# BOSS Project — Agent Instructions

## Lint
```bash
npm run lint
```

## Typecheck
None — project uses plain JavaScript (.js/.jsx), not TypeScript.

## Public Portfolio / Review System — Debugging

### Symptom
- `https://boss-africa.vercel.app/t/<slug>` shows **"Portfolio Not Found"**
- `/api/portfolios` returns **500**
- `/api/portfolio/<slug>` returns **404**

### Root cause (most common)
The live Supabase database predates the portfolio feature and is missing columns/tables.
The API now exposes the real error in the `detail` field of its JSON response, e.g.
`{"error":"Failed to fetch portfolios","detail":"column tailors.craft does not exist"}`.

Debug order:
1. `curl -s https://boss-africa.vercel.app/api/portfolios` — read the `detail` field.
2. Fix each reported missing column/table via SQL Editor (migration below).
3. If migration ran but API still 404s: confirm the app's Profile tab has **Public** toggled
   ON and **Save Changes** was tapped (that persists `portfolio_slug` + `portfolio_visible`
   via `db.setTailor`). Also confirm the SQL ran in the SAME Supabase project the app uses.

### Diagnostic SQL (run in Supabase → SQL Editor)
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'tailors' AND column_name IN ('craft','bos_score','bos_score_updated_at','logo_url','portfolio_slug','portfolio_visible');
SELECT to_regclass('public.portfolio_items') IS NOT NULL AS portfolio_items, to_regclass('public.review_requests') IS NOT NULL AS review_requests, to_regclass('public.portfolio_reviews') IS NOT NULL AS portfolio_reviews;
```

### Migration SQL (safe to re-run — IF NOT EXISTS everywhere)
```sql
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS craft text;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS bos_score integer DEFAULT 0 CHECK (bos_score >= 0 AND bos_score <= 100);
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS bos_score_updated_at timestamptz;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS portfolio_slug text;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS portfolio_visible boolean DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS tailors_portfolio_slug_key ON tailors(portfolio_slug);
```

Tables, RLS, storage bucket: see `migration-portfolio-review.sql` at repo root
(one statement per line — mobile copy-safe). Full schema: `supabase-schema.sql`.

### Related code
- `src/app/api/portfolio/[slug]/route.js` — public single portfolio
- `src/app/api/portfolios/route.js` — directory listing
- `src/app/t/[slug]/page.js` + `PortfolioClient.js` — public page
- `src/lib/db.js` `setTailor()` must whitelist `portfolio_slug`/`portfolio_visible` in its payload
- `src/components/boss/tabs/ProfileTab.jsx` `saveProfile()` — toggles Public + saves slug

### Reusable debugging prompt
Paste this into opencode (or any AI agent) when the portfolio/review feature is broken:

```
I'm debugging the public portfolio system in this BOSS app (Next.js + Supabase).
The live site https://boss-africa.vercel.app/t/<slug> shows "Portfolio Not Found"
and /api/portfolios returns 500.

Steps to investigate, in order:
1. Fetch https://boss-africa.vercel.app/api/portfolios and read the `detail` field
   (e.g. "column tailors.craft does not exist") — this tells you exactly what's missing.
2. If a column is missing, give me the SQL to add it (use ADD COLUMN IF NOT EXISTS)
   and the diagnostic query to verify the fix.
3. If tables are missing (portfolio_items / review_requests / portfolio_reviews),
   point me to migration-portfolio-review.sql and the RLS/storage policies needed.
4. If the DB looks complete but the page still 404s, check whether db.setTailor
   persists portfolio_slug and portfolio_visible, and whether ProfileTab saveProfile
   toggles Public ON. Confirm the app points at the same Supabase project that was migrated.
5. Verify with curl against the live API, and run `npm run lint` before committing.

Remember: this is a plain-JS project (no TS). Keep fixes minimal and push to
github.com/monoviejohn/Boss-app using the PAT token in the working notes.
```

### Mobile-user note
Users on phones struggle to copy multiline SQL from chat. Prefer single-line statements
(one statement per line) and point them to the raw GitHub file:
`https://raw.githubusercontent.com/monoviejohn/Boss-app/main/migration-portfolio-review.sql`
