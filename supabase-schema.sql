create extension if not exists "uuid-ossp";

create table if not exists tailors (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid references auth.users(id) on delete cascade unique,
  shop                   text not null default '',
  phone                  text,
  city                   text,
  bank_name              text,
  bank_code              text,
  account_number         text,
  account_name           text,
  portfolio_slug         text unique,
  portfolio_visible      boolean default false,
  craft                  text,
  bos_score              integer default 0 check (bos_score >= 0 and bos_score <= 100),
  bos_score_updated_at   timestamptz,
  self_declared_score    integer default 0,
  self_declared_at       timestamptz,
  years_in_business      text,
  phone_verified         boolean default false,
  phone_verified_at      timestamptz,
  crypto_address         text,
  created_at             timestamptz default now()
);


create table if not exists customers (
  id            uuid primary key default uuid_generate_v4(),
  tailor_id     uuid references tailors(id) on delete cascade not null,
  name          text not null,
  phone         text,
  gender        text default 'female' check (gender in ('male','female')),
  measurements  jsonb default '{}',
  notes         text,
  created_at    timestamptz default now()
);
create index if not exists customers_tailor_idx on customers(tailor_id);


create table if not exists orders (
  id                  uuid primary key default uuid_generate_v4(),
  customer_id         uuid references customers(id) on delete cascade not null,
  tailor_id           uuid references tailors(id) on delete cascade not null,
  type                text,
  price               numeric(12,2) default 0,
  deposit             numeric(12,2) default 0,
  paid                numeric(12,2) default 0,
  delivery_date       date,
  installment_history jsonb default '[]',
  image_urls          text[] default '{}',
  order_category      text default 'Other',
  status              text default 'In Progress'
                      check (status in ('In Progress','Ready','Delivered')),
  notes               text,
  paystack_ref        text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index if not exists orders_tailor_idx   on orders(tailor_id);
create index if not exists orders_customer_idx on orders(customer_id);
create index if not exists orders_delivery_idx on orders(delivery_date);
create index if not exists orders_status_idx   on orders(status);


create table if not exists payments (
  id                     uuid primary key default uuid_generate_v4(),
  order_id               uuid references orders(id) on delete set null,
  tailor_id              uuid references tailors(id) on delete cascade not null,
  amount                 numeric(12,2) not null,
  method                 text default 'cash'
                         check (method in ('cash','withdrawal','other')),
  paystack_ref           text,
  notes                  text,
  recorded_at            timestamptz default now()
);
create index if not exists payments_order_idx    on payments(order_id);
create index if not exists payments_tailor_idx   on payments(tailor_id);
create index if not exists payments_recorded_idx on payments(recorded_at);


-- Portfolio items (photos from delivered orders)
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

-- Portfolio reviews (customer reviews via review requests)
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

-- Review requests (tailor sends to customer via WhatsApp)
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


CREATE TABLE IF NOT EXISTS bos_score_history (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tailor_id       uuid NOT NULL REFERENCES tailors(id) ON DELETE CASCADE,
  score           integer NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at     timestamptz DEFAULT now() NOT NULL,
  order_count     integer,
  completion_rate numeric(5,2),
  repeat_rate     numeric(5,2),
  payment_rate    numeric(5,2),
  overdue_count   integer
);
CREATE INDEX IF NOT EXISTS bos_score_history_tailor_idx
  ON bos_score_history(tailor_id, computed_at DESC);


-- RLS
alter table tailors          enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table payments         enable row level security;
alter table bos_score_history enable row level security;
alter table portfolio_items  enable row level security;
alter table portfolio_reviews enable row level security;
alter table review_requests  enable row level security;


drop policy if exists "tailors_self"         on tailors;
drop policy if exists "customers_own_tailor" on customers;
drop policy if exists "orders_own_tailor"    on orders;
drop policy if exists "payments_own_tailor"  on payments;
drop policy if exists "Tailors see own score history"    on bos_score_history;
drop policy if exists "Tailors insert own score history" on bos_score_history;


create policy "tailors_self" on tailors
  for all using (auth.uid() = user_id);


create policy "customers_own_tailor" on customers
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));


create policy "orders_own_tailor" on orders
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));


create policy "payments_own_tailor" on payments
  for all using (tailor_id = (select id from tailors where user_id = auth.uid()));


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


create policy "Tailors see own score history" on bos_score_history
  for select using (tailor_id in (select id from tailors where user_id = auth.uid()));


create policy "Tailors insert own score history" on bos_score_history
  for insert with check (tailor_id in (select id from tailors where user_id = auth.uid()));


-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;


drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();


-- Auto-profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tailors (user_id, shop)
  VALUES (NEW.id, '')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── ORDER STYLE IMAGES — Storage bucket ──────────────────────────────
-- Run this block AFTER creating the bucket in the Supabase Dashboard:
--   Storage → Create bucket → name: "order-images" → Public bucket ✅
--
-- Or create it via SQL:
--   insert into storage.buckets (id, name, public)
--   values ('order-images', 'order-images', true)
--   on conflict (id) do nothing;
--
-- Policies:
insert into storage.buckets (id, name, public)
values ('order-images', 'order-images', true)
on conflict (id) do nothing;

drop policy if exists "Allow public to view" on storage.objects;
create policy "Allow public to view"
  on storage.objects for select
  using (bucket_id = 'order-images');

drop policy if exists "Allow authenticated inserts" on storage.objects;
create policy "Allow authenticated inserts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'order-images');

drop policy if exists "Allow authenticated updates" on storage.objects;
create policy "Allow authenticated updates"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'order-images');


-- ── PORTFOLIO PHOTOS — Storage bucket ───────────────────────────────────
-- Run this block AFTER creating the bucket in the Supabase Dashboard:
--   Storage → Create bucket → name: "portfolio-photos" → Public bucket ✅
--
-- Or create it via SQL:
--   insert into storage.buckets (id, name, public)
--   values ('portfolio-photos', 'portfolio-photos', true)
--   on conflict (id) do nothing;
--
-- Policies:
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


-- ═══════════════════════════════════════════════════════════════
-- FEEDBACK SYSTEM (Section A)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id    uuid REFERENCES tailors(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('nps', 'micro', 'bug', 'feature')),
  trigger      text,
  score        integer,
  message      text,
  app_version  text,
  screen       text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tailors_own_feedback" ON feedback;
CREATE POLICY "tailors_own_feedback" ON feedback
  FOR ALL USING (
    tailor_id = (SELECT id FROM tailors WHERE user_id = auth.uid())
  );


-- ═══════════════════════════════════════════════════════════════
-- REFERRAL SYSTEM (Section A)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     uuid REFERENCES tailors(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES tailors(id) ON DELETE SET NULL,
  referral_code   text UNIQUE NOT NULL,
  status          text DEFAULT 'pending'
                  CHECK (status IN ('pending','signed_up','activated','rewarded')),
  referred_at     timestamptz,
  activated_at    timestamptz,
  rewarded_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_own" ON referrals;
CREATE POLICY "referrals_own" ON referrals
  FOR ALL USING (
    referrer_id = (SELECT id FROM tailors WHERE user_id = auth.uid())
  );

-- Add referral columns to tailors
ALTER TABLE tailors
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES tailors(id),
  ADD COLUMN IF NOT EXISTS orders_count  integer DEFAULT 0;


-- ═══════════════════════════════════════════════════════════════
-- UPDATED AUTO-PROFILE TRIGGER — includes referral_code
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.tailors (user_id, shop, referral_code)
  VALUES (
    NEW.id,
    '',
    upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ═══════════════════════════════════════════════════════════════
-- FEEDBACK SUMMARY VIEW
-- ═══════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS public.feedback_summary;
CREATE VIEW public.feedback_summary
  WITH (security_invoker = true)
AS
SELECT
  tailor_id,
  type,
  COUNT(*) as count,
  AVG(score) as avg_score,
  MAX(created_at) as last_received
FROM feedback
GROUP BY tailor_id, type;


-- ═══════════════════════════════════════════════════════════════
-- REFERRAL REWARD RPC — boosts referrer's Trust Score by +5
-- ═══════════════════════════════════════════════════════════════

-- NOTE: function intentionally removed — it was SECURITY DEFINER
-- with no auth check, letting any authenticated user call it to
-- boost their own bos_score. It was also never called from the
-- app code. If re-added, use SECURITY INVOKER + explicit auth check.


-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Missing columns (safe to re-run — IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE tailors
  ADD COLUMN IF NOT EXISTS notif_delivery              boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_payments              boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_briefing              boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at                timestamptz,
  ADD COLUMN IF NOT EXISTS google_drive_refresh_token  text,
  ADD COLUMN IF NOT EXISTS self_declared_years         text,
  ADD COLUMN IF NOT EXISTS logo_url                    text,
  ADD COLUMN IF NOT EXISTS portfolio_slug              text,
  ADD COLUMN IF NOT EXISTS portfolio_visible           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS meas_unit                   text DEFAULT 'inches',
  ADD COLUMN IF NOT EXISTS custom_meas_fields          jsonb,
  ADD COLUMN IF NOT EXISTS meas_config                 jsonb,
  ADD COLUMN IF NOT EXISTS welcome_sent_at             timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS tailors_portfolio_slug_key ON tailors(portfolio_slug);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS voice_note_url text;

UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL;


-- ═══════════════════════════════════════════════════════════════
-- PUSH SUBSCRIPTIONS TABLE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id uuid REFERENCES tailors(id) ON DELETE CASCADE NOT NULL,
  endpoint  text UNIQUE NOT NULL,
  p256dh    text NOT NULL,
  auth_key  text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tailors_own_push_subs" ON push_subscriptions;
CREATE POLICY "tailors_own_push_subs" ON push_subscriptions
  FOR ALL USING (
    tailor_id = (SELECT id FROM tailors WHERE user_id = auth.uid())
  );
