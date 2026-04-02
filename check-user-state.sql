-- Run this in Supabase SQL Editor to check your user state
-- Replace 'your-email@example.com' with your actual email

SELECT 
  id,
  email,
  plan,
  twilio_number,
  area_code,
  stripe_customer_id,
  stripe_sub_id,
  created_at
FROM users
WHERE email = 'your-email@example.com';

-- This will show you what the database actually has
-- Expected after successful purchase:
-- plan: 'monthly' (not 'free' or 'pro')
-- stripe_customer_id: 'cus_...'
-- stripe_sub_id: 'sub_...'
-- area_code: '302' (or whatever you entered)
-- twilio_number: NULL or '+1302...' (should be provisioned)
