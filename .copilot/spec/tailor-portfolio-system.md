# Spec: tailor-portfolio-system
**Status:** approved
**Type:** feature
**Created:** 2026-08-01
**Author:** developer (portfolio feature build)

## Summary
Build a complete tailor portfolio system: photo gallery from delivered orders, customer reviews via WhatsApp, public portfolio pages at `/t/[slug]`, a directory at `/portfolios`, and full SEO/sitemap integration. The portfolio page is the tailor's professional page — BOSS branding is understated.

## User Stories
1. **As a tailor**, after marking an order Delivered, I can add photos of the finished work to my portfolio with a caption.
2. **As a tailor**, I can request a review from a customer via WhatsApp (pre-filled link with unique token).
3. **As a customer**, I can leave a 1–5 star review + text via a public link — no login required.
4. **As a potential customer**, I can browse portfolios by city/craft at `/portfolios` and visit a tailor's page at `/t/[slug]`.
5. **As a tailor**, I control whether my portfolio is public (visibility toggle in Profile).

## Acceptance Criteria

### Stage 1 — Database
- [ ] AC1.1: `portfolio_items` table with RLS (tailor owns rows)
- [ ] AC1.2: `portfolio_reviews` table with RLS (tailor reads all, public reads only `is_public=true`)
- [ ] AC1.3: `review_requests` table with RLS (tailor owns rows)
- [ ] AC1.4: `portfolio_slug` column on `tailors` with UNIQUE index
- [ ] AC1.5: `portfolio_visible` boolean on `tailors` (default false)
- [ ] AC1.6: Storage bucket `portfolio-photos` with folder-scoped RLS (`tailor_id` prefix)
- [ ] AC1.7: All policies mirror existing `orders`/`customers` pattern

### Stage 2 — Photo-to-gallery pipeline
- [ ] AC2.1: "Add to portfolio" button in OrderDetailFlow (only when order.status === "Delivered")
- [ ] AC2.2: Opens camera/gallery picker, accepts JPEG/PNG/WebP
- [ ] AC2.3: Client-side resize to max 1200px (canvas) before upload
- [ ] AC2.4: Caption field (optional, max 200 chars)
- [ ] AC2.5: Uploads to `portfolio-photos` bucket at `tailor_id/{uuid}.webp`
- [ ] AC2.6: Inserts `portfolio_items` row with `image_url`, `caption`, `order_id`
- [ ] AC2.7: Reuses existing upload pattern from codebase if available

### Stage 3 — Review request + submission flow
- [ ] AC3.1: "Request review" action in OrderDetailFlow (delivered orders) + Profile
- [ ] AC3.2: Creates `review_requests` row with unique `token`, `order_id` (nullable), `tailor_id`
- [ ] AC3.3: Opens `wa.me` link with pre-filled message containing review URL
- [ ] AC3.4: Public route `/review/[token]` — no auth, mobile-first
- [ ] AC3.5: Star picker (1–5), name (required), review text (required, max 1000 chars)
- [ ] AC3.6: POSTs to `/api/review/[token]` using SERVICE_ROLE_KEY (public API pattern)
- [ ] AC3.7: Reviews immutable once submitted — tailor can only toggle `is_public`
- [ ] AC3.8: Enforced at API layer (no UPDATE on review text/stars)

### Stage 4 — Portfolio page (`/t/[slug]`)
- [ ] AC4.1: Public route, one per tailor, auto-created at signup from shop name
- [ ] AC4.2: Slug generation: lowercase, alphanumeric + hyphens, unique (append `-2`, `-3` on conflict)
- [ ] AC4.3: Sections: shop name, city, craft, BOS Score badge, photo gallery, reviews, WhatsApp CTA
- [ ] AC4.4: `generateMetadata()` with unique title/description per tailor
- [ ] AC4.5: `LocalBusiness` + `AggregateRating` JSON-LD from real reviews only
- [ ] AC4.5: If `portfolio_visible = false` → 404 (not empty page)
- [ ] AC4.6: Small "Powered by BOSS" credit, footer, understated

### Stage 5 — Portfolio directory (`/portfolios`)
- [ ] AC5.1: Lists published, opted-in portfolios (`portfolio_visible = true`)
- [ ] AC5.2: Filterable by city (select) and craft (select)
- [ ] AC5.3: `ItemList` JSON-LD linking to each `/t/[slug]`
- [ ] AC5.4: Linked from landing page (new section or nav)

### Stage 6 — Sitemap + robots
- [ ] AC6.1: Published tailor slugs added to `src/app/sitemap.js` dynamically
- [ ] AC6.2: `src/app/robots.js` created with allow-all + sitemap reference

## Database Schema (to add to supabase-schema.sql)

```sql
-- portfolio_items
create table if not exists portfolio_items (
  id              uuid primary key default uuid_generate_v4(),
  tailor_id       uuid references tailors(id) on delete cascade not null,
  order_id        uuid references orders(id) on delete set null,
  image_url       text not null,
  caption         text,
  sort_order      integer default 0,
  created_at      timestamptz default now()
);
create index if not exists portfolio_items_tailor_idx on portfolio_items(tailor_id);
create index if not exists portfolio_items_order_idx on portfolio_items(order_id);

-- portfolio_reviews
create table if not exists portfolio_reviews (
  id              uuid primary key default uuid_generate_v4(),
  tailor_id       uuid references tailors(id) on delete cascade not null,
  order_id        uuid references orders(id) on delete set null,
  review_request_id uuid references review_requests(id) on delete set null,
  reviewer_name   text not null,
  rating          integer not null check (rating >= 1 and rating <= 5),
  review_text     text not null,
  is_public       boolean default false,
  created_at      timestamptz default now()
);
create index if not exists portfolio_reviews_tailor_idx on portfolio_reviews(tailor_id);
create index if not exists portfolio_reviews_public_idx on portfolio_reviews(tailor_id, is_public) where is_public = true;

-- review_requests
create table if not exists review_requests (
  id              uuid primary key default uuid_generate_v4(),
  tailor_id       uuid references tailors(id) on delete cascade not null,
  order_id        uuid references orders(id) on delete set null,
  token           text not null unique,
  sent_at         timestamptz default now(),
  completed_at    timestamptz
);
create index if not exists review_requests_tailor_idx on review_requests(tailor_id);
create index if not exists review_requests_token_idx on review_requests(token);

-- tailors additions
alter table public.tailors
  add column if not exists portfolio_slug text unique,
  add column if not exists portfolio_visible boolean default false,
  add column if not exists craft text;
```

## RLS Policies (matching orders/customers pattern)

```sql
alter table portfolio_items enable row level security;
alter table portfolio_reviews enable row level security;
alter table review_requests enable row level security;

-- portfolio_items: tailor owns their items
drop policy if exists "portfolio_items_own_tailor" on portfolio_items;
create policy "portfolio_items_own_tailor" on portfolio_items
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));

-- portfolio_reviews: tailor reads all, public reads only is_public=true
drop policy if exists "portfolio_reviews_own_tailor" on portfolio_reviews;
create policy "portfolio_reviews_own_tailor" on portfolio_reviews
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));
drop policy if exists "portfolio_reviews_public_read" on portfolio_reviews;
create policy "portfolio_reviews_public_read" on portfolio_reviews
  for select using (is_public = true);

-- review_requests: tailor owns their requests
drop policy if exists "review_requests_own_tailor" on review_requests;
create policy "review_requests_own_tailor" on review_requests
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));
```

## Storage Bucket (portfolio-photos)

```sql
insert into storage.buckets (id, name, public)
values ('portfolio-photos', 'portfolio-photos', true)
on conflict (id) do nothing;

-- RLS: tailors can only access their own folder (tailor_id/*)
drop policy if exists "portfolio_photos_own_tailor" on storage.objects;
create policy "portfolio_photos_own_tailor" on storage.objects
  for all using (
    bucket_id = 'portfolio-photos' AND
    (storage.foldername(name))[1] = (select id::text from tailors where user_id = auth.uid())
  );

-- Public read access
drop policy if exists "portfolio_photos_public_read" on storage.objects;
create policy "portfolio_photos_public_read" on storage.objects
  for select using (bucket_id = 'portfolio-photos');
```

## Out of Scope
- Payment/booking through portfolio page
- AI-generated or AI-edited review text
- Multi-language pages
- Changes to existing Tier-1 bug list

## Open Questions
1. **Supabase storage tier** — Does the current plan support server-side image transforms? If not, client-side resize to ~1200px is required (Stage 2).
2. **Craft field on tailors** — Should `craft` be a free-text field or an enum? Defaulting to free-text for flexibility.

## Approval
- [ ] Approved by: Product Agent
- [ ] Date: 2026-08-01