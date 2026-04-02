-- Manual fix for your existing account
-- Run this in Supabase SQL Editor

-- Step 1: Find your auth user ID
-- Replace 'your-email@example.com' with your actual email
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: Create user record in users table
-- Replace the values below with your actual data
INSERT INTO users (
  id,
  email,
  plan,
  stripe_customer_id,
  stripe_sub_id,
  area_code
) VALUES (
  'YOUR_AUTH_USER_ID_FROM_STEP_1',  -- Copy the ID from step 1
  'your-email@example.com',          -- Your email
  'monthly',                          -- Your plan
  'cus_UCOeKXWPnybgaQ',              -- From Stripe subscription data you shared
  'sub_1TDzqxLza8h22DgjNjGuGjch',   -- From Stripe subscription data you shared
  '302'                               -- Your area code (change if different)
)
ON CONFLICT (id) DO UPDATE SET
  plan = EXCLUDED.plan,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_sub_id = EXCLUDED.stripe_sub_id,
  area_code = EXCLUDED.area_code;

-- Step 3: Verify the record was created
SELECT id, email, plan, stripe_sub_id, area_code FROM users WHERE email = 'your-email@example.com';
