-- Migration: Add coupons table
-- Run this against your Supabase production DB

CREATE TABLE IF NOT EXISTS coupons (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT NOT NULL UNIQUE,
  description        TEXT,
  percent_off        FLOAT NOT NULL,
  duration           TEXT NOT NULL,  -- 'once' | 'repeating' | 'forever'
  duration_in_months INT,
  applies_to         TEXT NOT NULL DEFAULT 'both', -- 'monthly' | 'annual' | 'both'
  max_redemptions    INT,
  times_redeemed     INT NOT NULL DEFAULT 0,
  expires_at         TIMESTAMPTZ,
  stripe_coupon_id   TEXT,
  stripe_promo_code_id TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons (code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons (is_active);
