# Friend Invite & Approval System Design

## Core Safety Principle

**No unsupervised contact between children. All connections require mutual parent approval.**

---

## User Flow

### Sending a Friend Invite (QR Code Method)

1. **Parent A** logs into Parent Portal
2. Goes to "Friends" tab
3. Clicks "Create Friend Invite"
4. System generates unique invite link and QR code
5. **Parent A shares QR code** via:
   - Show QR code in person (at school pickup, playdate, etc.)
   - Send via email
   - Send via text message
   - Print and hand to other parent
6. Parent A sees invite as "Pending" until accepted

### Accepting a Friend Invite (QR Code Scan)

1. **Parent B** scans QR code with phone camera
2. Opens invite link → Redirected to Ring Ring
3. If not logged in: Prompted to login or create account
4. If logged in: Sees invite details:
   - Parent A's name/email
   - Option to select which of their devices can connect
5. Clicks "Accept & Connect"
6. Both parents can now add each other's devices to their contact lists

### Alternative: Email Invite (Optional)

1. **Parent A** can also enter Parent B's email directly
2. System sends email with QR code embedded
3. Parent B clicks link or scans QR code from email
4. Same acceptance flow as above

### Adding Approved Friends as Contacts

1. After invite is accepted, both parents see each other in "Approved Friends"
2. Parent can assign friend's device to quick dial slots
3. Contact appears as: "Emma (Kitchen Phone)" with SIP username
4. Only approved friends can be added as contacts

---

## Database Schema

### New Tables

```sql
-- Friend invites (parent to parent)
CREATE TABLE friend_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  recipient_email TEXT NOT NULL,
  recipient_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, cancelled
  invite_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(sender_user_id, recipient_email)
);

-- Approved friendships (bidirectional)
CREATE TABLE friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (user_a_id < user_b_id), -- Ensure only one record per pair
  UNIQUE(user_a_id, user_b_id)
);

-- Friend devices (which devices can call each other)
CREATE TABLE friend_device_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id TEXT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  allowed_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(friendship_id, device_id)
);
```

### Updated Contacts Table

```sql
-- Add friendship validation to contacts
ALTER TABLE contacts ADD COLUMN friendship_id TEXT REFERENCES friendships(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN is_approved BOOLEAN DEFAULT false;

-- Constraint: contacts must be linked to approved friendship
CREATE INDEX idx_contacts_friendship ON contacts(friendship_id);
```

---

## API Endpoints

### POST /api/friends/invite
**Send friend invite**
```typescript
{
  recipientEmail: string,
  senderName?: string,
  message?: string
}
```

### POST /api/friends/accept
**Accept friend invite**
```typescript
{
  inviteToken: string,
  deviceIds: string[] // Which of my devices can connect
}
```

### POST /api/friends/reject
**Reject friend invite**
```typescript
{
  inviteToken: string
}
```

### GET /api/friends
**Get all friendships and pending invites**

### DELETE /api/friends/:friendshipId
**Remove friendship (both parents must approve removal)**

### POST /api/friends/:friendshipId/devices
**Add/remove devices from friendship**
```typescript
{
  deviceId: string,
  action: 'add' | 'remove'
}
```

---

## Email Templates

### Friend Invite Email

**Subject:** [Parent Name] wants to connect on Ring Ring

**Body:**
```
Hi there!

[Parent Name] ([parent@email.com]) has invited you to connect on Ring Ring so your kids can call each other safely.

Ring Ring is a parent-supervised phone service for kids. Both parents must approve the connection before any calls can be made.

[Accept Invite Button]

This invite expires in 7 days.

Questions? Reply to this email.

Ring Ring Team
```

### Invite Accepted Email

**Subject:** Friend invite accepted!

**Body:**
```
Great news! [Parent Name] accepted your Ring Ring friend invite.

You can now add their devices to your contact list in the Parent Portal.

[Go to Parent Portal Button]

Ring Ring Team
```

---

## UI Components

### Friends Tab (New)

**Sections:**
1. **Send Invite**
   - Email input
   - Optional message
   - "Send Invite" button

2. **Pending Invites**
   - Sent invites (with cancel option)
   - Received invites (with accept/reject)

3. **Approved Friends**
   - List of connected families
   - Their devices
   - Option to add to contacts
   - Option to remove friendship

### Contact Management (Updated)

**Before adding contact:**
1. Check if friendship exists
2. If not, show "Send friend invite first"
3. If yes, show list of friend's approved devices
4. Select device to add to quick dial

---

## Safety Features

### 1. Parent-Only Access
- Dashboard renamed to "Parent Portal"
- Login page emphasizes "Parent/Guardian Login"
- Warning: "This portal is for parents/guardians only. Children should not access this system."

### 2. Email Verification Required
- Both parents must have verified email addresses
- No invites can be sent/accepted without verification

### 3. Mutual Approval
- Both parents must explicitly approve connection
- Either parent can revoke at any time
- Revocation immediately removes all contacts

### 4. Device-Level Control
- Parents choose which devices can connect
- Can have multiple devices but only allow some to connect with certain friends

### 5. Audit Trail
- All invites, acceptances, and removals logged
- Parents can see connection history

### 6. Expiring Invites
- Invites expire after 7 days
- Prevents old invites from being used

---

## Calling Flow (Updated)

### Before Call is Placed

1. Device attempts to call contact
2. System checks:
   - Is contact linked to approved friendship? ✓
   - Is friendship still active? ✓
   - Is calling device approved for this friendship? ✓
   - Is called device approved for this friendship? ✓
3. If all checks pass → Call proceeds
4. If any check fails → Call blocked, parent notified

### Call Routing

```
Device A (Kitchen Phone) → Twilio SIP Domain
  ↓
Check: Is target SIP username in approved contacts?
  ↓
Check: Is friendship active?
  ↓
Route to Device B (Emma's Phone)
```

---

## Migration Plan

### Phase 1: Database Schema
1. Create new tables (friend_invites, friendships, friend_device_permissions)
2. Add friendship_id to contacts table
3. Migrate existing contacts to "legacy" status (require re-approval)

### Phase 2: API Implementation
1. Implement invite endpoints
2. Implement friendship management
3. Update contact creation to require friendship

### Phase 3: UI Updates
1. Rename "Dashboard" to "Parent Portal"
2. Add Friends tab
3. Update contact management flow
4. Add safety warnings and parent-only messaging

### Phase 4: Email Integration
1. Create email templates
2. Implement invite sending
3. Implement acceptance flow

### Phase 5: Call Validation
1. Update Twilio webhook to validate friendships
2. Block calls between non-approved devices
3. Log all call attempts

---

## Branding & Messaging

### Parent Portal Header
```
🔒 Ring Ring Parent Portal
Adult supervision required. Keep your login secure.
```

### Login Page
```
Parent/Guardian Login

Ring Ring is designed for parent-supervised use. 
Children should not access this portal.

By logging in, you confirm you are a parent or legal guardian.
```

### Friends Tab Intro
```
👥 Manage Connections

Ring Ring requires mutual parent approval before kids can call each other.

How it works:
1. Send invite to another parent's email
2. They accept and choose which devices can connect
3. You can add their devices to your contact list
4. Kids can safely call approved friends

No strangers. No surprises. Parent-controlled.
```

---

## Privacy & Security

### Data Protection
- Friend invites contain no child information
- Only parent emails and device names shared
- No phone numbers exposed until friendship approved

### Consent
- Both parents must explicitly consent
- Clear explanation of what data is shared
- Option to revoke at any time

### Transparency
- Parents see all active friendships
- Parents see all pending invites
- Parents can export connection history

---

## Edge Cases

### What if parent removes friendship?
- All contacts from that friendship deleted
- Devices can no longer call each other
- Both parents notified
- Can re-invite if desired

### What if parent deletes account?
- All friendships removed
- All contacts deleted
- Other parents notified

### What if invite is sent to non-user?
- Recipient can create account to accept
- Invite link works for 7 days
- After acceptance, normal flow continues

### What if both parents send invites to each other?
- First invite accepted creates friendship
- Second invite auto-accepted (friendship already exists)
- Both parents notified

---

## Success Metrics

### Safety Metrics
- 100% of contacts require approved friendship
- 0 calls between non-approved devices
- Parent approval time (target: < 24 hours)

### Engagement Metrics
- % of users with at least 1 friendship
- Average friendships per user
- Invite acceptance rate

### Support Metrics
- Support tickets related to friend system
- Parent feedback on ease of use
- Time to complete first friendship

---

## Future Enhancements

### Group Friendships
- Allow multiple families to connect
- Useful for classrooms, sports teams
- Requires all parents to approve

### Temporary Permissions
- Allow calls for specific time period
- Useful for playdates, sleepovers
- Auto-expires after set time

### Emergency Contacts
- Bypass friendship requirement for 911, parents
- Still logged and monitored
- Cannot be disabled

### Activity Reports
- Weekly summary of calls made/received
- Who kids are calling most
- Call duration trends
