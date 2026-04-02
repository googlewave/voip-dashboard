# Database Migration Instructions

## ⚠️ IMPORTANT: Run this SQL in Supabase SQL Editor FIRST

Before the new features will work, you need to run this migration in your Supabase dashboard.

### Steps:

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy and paste the SQL below
3. Click "Run"

---

## Migration SQL

```sql
-- Add friend invite system tables
CREATE TABLE IF NOT EXISTS friend_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sender_user_id TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  accepted_by_user_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_friend_invites_token ON friend_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_friend_invites_sender ON friend_invites(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_invites_status ON friend_invites(status);

-- Add friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_a_id TEXT NOT NULL,
  user_b_id TEXT NOT NULL,
  created_from_invite_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_a ON friendships(user_a_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_b ON friendships(user_b_id);

-- Add friend device permissions table
CREATE TABLE IF NOT EXISTS friend_device_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  friendship_id TEXT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(friendship_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_device_permissions_friendship ON friend_device_permissions(friendship_id);
CREATE INDEX IF NOT EXISTS idx_friend_device_permissions_device ON friend_device_permissions(device_id);

-- Update contacts table to support Ring Ring friends
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type TEXT DEFAULT 'phone_number';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS friendship_id TEXT REFERENCES friendships(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS friend_device_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sip_username TEXT;
ALTER TABLE contacts ALTER COLUMN phone_number DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_device ON contacts(device_id);
CREATE INDEX IF NOT EXISTS idx_contacts_friendship ON contacts(friendship_id);
CREATE INDEX IF NOT EXISTS idx_contacts_sip_username ON contacts(sip_username);
```

---

## After Running Migration

1. The new features will be available immediately
2. Existing contacts will continue to work (they'll be `contact_type = 'phone_number'`)
3. New Ring Ring friend contacts will be `contact_type = 'ring_ring_friend'`

---

## Verify Migration Success

Run this query to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('friend_invites', 'friendships', 'friend_device_permissions');
```

You should see all 3 tables listed.

---

## What This Enables

✅ Friend invite system with QR codes
✅ Mutual parent approval
✅ Ring Ring to Ring Ring calling (free, SIP-to-SIP)
✅ Phone number calling (paid plan, PSTN)
✅ Orange dial pad buttons for friends
✅ Blue dial pad buttons for phone numbers
