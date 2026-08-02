-- Migration: portfolio + review system (safe to run multiple times)

-- 0. Add missing columns to existing tailors table
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS portfolio_slug text;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS portfolio_visible boolean DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS tailors_portfolio_slug_key ON tailors(portfolio_slug);

-- 1. Portfolio items (photos from delivered orders)
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

-- 2. Review requests
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

-- 3. Portfolio reviews
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

-- 4. Enable RLS
alter table portfolio_items  enable row level security;
alter table portfolio_reviews enable row level security;
alter table review_requests  enable row level security;

-- 5. Policies
drop policy if exists "portfolio_items_own_tailor" on portfolio_items;
create policy "portfolio_items_own_tailor" on portfolio_items
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));

drop policy if exists "portfolio_reviews_own_tailor" on portfolio_reviews;
create policy "portfolio_reviews_own_tailor" on portfolio_reviews
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));

drop policy if exists "portfolio_reviews_public_read" on portfolio_reviews;
create policy "portfolio_reviews_public_read" on portfolio_reviews
  for select using (is_public = true);

drop policy if exists "review_requests_own_tailor" on review_requests;
create policy "review_requests_own_tailor" on review_requests
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));

-- 6. Portfolio photos storage bucket
insert into storage.buckets (id, name, public)
values ('portfolio-photos', 'portfolio-photos', true)
on conflict (id) do nothing;

drop policy if exists "portfolio_photos_own_tailor" on storage.objects;
create policy "portfolio_photos_own_tailor" on storage.objects
  for all using (
    bucket_id = 'portfolio-photos' AND
    (storage.foldername(name))[1] = (select id::text from tailors where user_id = auth.uid())
  );

drop policy if exists "portfolio_photos_public_read" on storage.objects;
create policy "portfolio_photos_public_read" on storage.objects
  for select using (bucket_id = 'portfolio-photos');
