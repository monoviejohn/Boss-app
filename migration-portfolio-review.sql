-- Migration: portfolio + review system (mobile-copy friendly: one statement per line)

ALTER TABLE tailors ADD COLUMN IF NOT EXISTS portfolio_slug text;
ALTER TABLE tailors ADD COLUMN IF NOT EXISTS portfolio_visible boolean DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS tailors_portfolio_slug_key ON tailors(portfolio_slug);

CREATE TABLE IF NOT EXISTS portfolio_items (id uuid primary key default uuid_generate_v4(), tailor_id uuid references tailors(id) on delete cascade not null, order_id uuid references orders(id) on delete set null, image_url text not null, caption text, sort_order integer default 0, created_at timestamptz default now());
CREATE TABLE IF NOT EXISTS review_requests (id uuid primary key default uuid_generate_v4(), tailor_id uuid references tailors(id) on delete cascade not null, order_id uuid references orders(id) on delete set null, token text not null unique, sent_at timestamptz default now(), completed_at timestamptz);
CREATE TABLE IF NOT EXISTS portfolio_reviews (id uuid primary key default uuid_generate_v4(), tailor_id uuid references tailors(id) on delete cascade not null, order_id uuid references orders(id) on delete set null, review_request_id uuid references review_requests(id) on delete set null, reviewer_name text not null, rating integer not null check (rating >= 1 and rating <= 5), review_text text not null, is_public boolean default false, created_at timestamptz default now());

CREATE INDEX IF NOT EXISTS portfolio_items_tailor_idx ON portfolio_items(tailor_id);
CREATE INDEX IF NOT EXISTS portfolio_items_order_idx ON portfolio_items(order_id);
CREATE INDEX IF NOT EXISTS review_requests_tailor_idx ON review_requests(tailor_id);
CREATE INDEX IF NOT EXISTS review_requests_token_idx ON review_requests(token);
CREATE INDEX IF NOT EXISTS portfolio_reviews_tailor_idx ON portfolio_reviews(tailor_id);
CREATE INDEX IF NOT EXISTS portfolio_reviews_public_idx ON portfolio_reviews(tailor_id, is_public) WHERE is_public = true;

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_items_own_tailor" ON portfolio_items;
CREATE POLICY "portfolio_items_own_tailor" ON portfolio_items FOR ALL USING (tailor_id = (SELECT id FROM tailors WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "portfolio_reviews_own_tailor" ON portfolio_reviews;
CREATE POLICY "portfolio_reviews_own_tailor" ON portfolio_reviews FOR ALL USING (tailor_id = (SELECT id FROM tailors WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "portfolio_reviews_public_read" ON portfolio_reviews;
CREATE POLICY "portfolio_reviews_public_read" ON portfolio_reviews FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "review_requests_own_tailor" ON review_requests;
CREATE POLICY "review_requests_own_tailor" ON review_requests FOR ALL USING (tailor_id = (SELECT id FROM tailors WHERE user_id = auth.uid()));

INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-photos', 'portfolio-photos', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "portfolio_photos_own_tailor" ON storage.objects;
CREATE POLICY "portfolio_photos_own_tailor" ON storage.objects FOR ALL USING (bucket_id = 'portfolio-photos' AND (storage.foldername(name))[1] = (SELECT id::text FROM tailors WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "portfolio_photos_public_read" ON storage.objects;
CREATE POLICY "portfolio_photos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio-photos');
