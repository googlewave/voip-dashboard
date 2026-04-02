-- Add quiet hours and usage cap columns to devices table
ALTER TABLE devices
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT,
ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT,
ADD COLUMN IF NOT EXISTS usage_cap_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS usage_cap_minutes INTEGER;

-- Add subscription fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update existing devices to have default values
UPDATE devices
SET quiet_hours_enabled = FALSE,
    usage_cap_enabled = FALSE
WHERE quiet_hours_enabled IS NULL;
