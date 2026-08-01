-- Wallet/DVA Schema Cleanup (P3 — schema hygiene)
-- Run in Supabase SQL Editor after backing up.
-- All these artifacts are unused since Paystack removal (BOSS v2).

-- 1. Drop unused columns from tailors
ALTER TABLE public.tailors
  DROP COLUMN IF EXISTS wallet_balance,
  DROP COLUMN IF EXISTS wallet_last_updated_at,
  DROP COLUMN IF EXISTS virtual_account_number,
  DROP COLUMN IF EXISTS virtual_account_name,
  DROP COLUMN IF EXISTS virtual_account_status,
  DROP COLUMN IF EXISTS virtual_bank_name,
  DROP COLUMN IF EXISTS paystack_dva_id,
  DROP COLUMN IF EXISTS paystack_customer_code;

-- 2. Drop unused columns from payments (keep paystack_ref for order idempotency)
ALTER TABLE public.payments
  DROP COLUMN IF EXISTS virtual_account_number,
  DROP COLUMN IF EXISTS sender_name;

-- 3. Drop withdrawals table (orphaned, no code references)
DROP TABLE IF EXISTS public.withdrawals CASCADE;

-- 4. Drop increment_wallet_balance RPC (uncalled)
DROP FUNCTION IF EXISTS public.increment_wallet_balance(uuid, numeric);

-- 5. Verify cleanup
SELECT 'Cleanup complete. Remaining tailors columns:' AS status;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tailors'
ORDER BY ordinal_position;

SELECT 'Remaining payments columns:' AS status;
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'payments'
ORDER BY ordinal_position;