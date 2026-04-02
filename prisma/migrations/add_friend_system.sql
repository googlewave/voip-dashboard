-- Add friend invite system tables
CREATE TABLE friend_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id TEXT NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  accepted_by_user_id TEXT
);

CREATE INDEX idx_friend_invites_token ON friend_invites(invite_token);
CREATE INDEX idx_friend_invites_sender ON friend_invites(sender_user_id);
CREATE INDEX idx_friend_invites_status ON friend_invites(status);

-- Add friendships table
CREATE TABLE friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id TEXT NOT NULL,
  user_b_id TEXT NOT NULL,
  created_from_invite_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

CREATE INDEX idx_friendships_user_a ON friendships(user_a_id);
CREATE INDEX idx_friendships_user_b ON friendships(user_b_id);

-- Add friend device permissions table
CREATE TABLE friend_device_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id TEXT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(friendship_id, device_id)
);

CREATE INDEX idx_friend_device_permissions_friendship ON friend_device_permissions(friendship_id);
CREATE INDEX idx_friend_device_permissions_device ON friend_device_permissions(device_id);

-- Update contacts table to support Ring Ring friends
ALTER TABLE contacts ADD COLUMN contact_type TEXT DEFAULT 'phone_number';
ALTER TABLE contacts ADD COLUMN friendship_id TEXT REFERENCES friendships(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN friend_device_id TEXT;
ALTER TABLE contacts ADD COLUMN sip_username TEXT;
ALTER TABLE contacts ALTER COLUMN phone_number DROP NOT NULL;

CREATE INDEX idx_contacts_user ON contacts(user_id);
CREATE INDEX idx_contacts_device ON contacts(device_id);
CREATE INDEX idx_contacts_friendship ON contacts(friendship_id);
CREATE INDEX idx_contacts_sip_username ON contacts(sip_username);

-- Add constraint: contact must have either phone_number OR sip_username
ALTER TABLE contacts ADD CONSTRAINT contact_must_have_identifier 
  CHECK (
    (contact_type = 'ring_ring_friend' AND sip_username IS NOT NULL) OR
    (contact_type = 'phone_number' AND phone_number IS NOT NULL)
  );
