# QR Code Friend Invite Flow

## Quick Summary

**Parent A generates QR code → Parent B scans → Instant friendship approval → Kids can call safely**

---

## Visual Flow

```
Parent A (Parent Portal)
    ↓
Click "Create Friend Invite"
    ↓
QR Code Generated
    ↓
Share QR (in person, email, text)
    ↓
Parent B scans QR code
    ↓
Opens: voip-dashboard-sigma.vercel.app/invite/[token]
    ↓
Login/Signup if needed
    ↓
Accept page shows:
  - Parent A's name
  - "Select which devices can connect"
  - Device checkboxes
    ↓
Click "Accept & Connect"
    ↓
✅ Friendship Created
    ↓
Both parents can add each other's devices to contacts
```

---

## Implementation Details

### 1. Invite Generation

**Endpoint:** `POST /api/friends/invite/create`

**Request:**
```typescript
{
  // Optional: can send to specific email
  recipientEmail?: string
}
```

**Response:**
```typescript
{
  inviteToken: string,
  inviteUrl: string, // https://voip-dashboard-sigma.vercel.app/invite/abc123
  expiresAt: string
}
```

**Frontend displays:**
- QR code (using qrcode.react)
- Invite URL (for copy/paste)
- "Share" buttons (email, SMS)
- "Print" button

### 2. Invite Acceptance Page

**Route:** `/invite/[token]`

**Page flow:**
1. Check if user is logged in
   - If not: Redirect to login with `?redirect=/invite/[token]`
   - If yes: Continue
2. Fetch invite details: `GET /api/friends/invite/[token]`
3. Show acceptance form:
   - Sender's name/email
   - Your devices (checkboxes)
   - "Accept & Connect" button
4. On accept: `POST /api/friends/invite/[token]/accept`

### 3. Database Schema (Simplified)

```sql
-- Friend invites
CREATE TABLE friend_invites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired
  expires_at TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  accepted_by_user_id TEXT REFERENCES users(id)
);

-- Friendships (bidirectional)
CREATE TABLE friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_from_invite_id TEXT REFERENCES friend_invites(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (user_a_id < user_b_id),
  UNIQUE(user_a_id, user_b_id)
);

-- Which devices can connect
CREATE TABLE friend_device_permissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id TEXT NOT NULL REFERENCES friendships(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(friendship_id, device_id)
);

-- Update contacts to require friendship
ALTER TABLE contacts ADD COLUMN friendship_id TEXT REFERENCES friendships(id) ON DELETE CASCADE;
CREATE INDEX idx_contacts_friendship ON contacts(friendship_id);
```

---

## UI Components

### Friends Tab - Create Invite Section

```tsx
<div className="bg-white rounded-3xl p-6 border-2 border-stone-100">
  <h2 className="text-lg font-black text-stone-900 mb-2">
    👥 Connect with Another Family
  </h2>
  <p className="text-sm text-stone-500 mb-6">
    Generate a QR code to share with another parent. They'll scan it to connect your families safely.
  </p>
  
  <button
    onClick={createInvite}
    className="px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition"
  >
    Create Friend Invite
  </button>
</div>
```

### QR Code Modal

```tsx
{showInviteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-3xl p-8 max-w-lg w-full">
      <h2 className="text-2xl font-black text-stone-900 mb-4">
        Share Friend Invite
      </h2>
      
      {/* QR Code */}
      <div className="bg-stone-50 rounded-2xl p-6 text-center mb-6">
        <p className="text-sm font-bold text-stone-600 mb-4">
          Show this QR code to another parent
        </p>
        <div className="bg-white p-4 rounded-xl inline-block">
          <QRCodeSVG
            value={inviteUrl}
            size={200}
            level="M"
          />
        </div>
      </div>
      
      {/* Share Options */}
      <div className="space-y-3">
        <button className="w-full px-4 py-3 bg-blue-100 text-blue-800 font-bold rounded-xl hover:bg-blue-200 transition">
          📧 Send via Email
        </button>
        <button className="w-full px-4 py-3 bg-green-100 text-green-800 font-bold rounded-xl hover:bg-green-200 transition">
          💬 Send via Text
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(inviteUrl)}
          className="w-full px-4 py-3 bg-stone-100 text-stone-700 font-bold rounded-xl hover:bg-stone-200 transition"
        >
          📋 Copy Link
        </button>
      </div>
      
      {/* Expiration */}
      <p className="text-xs text-stone-500 text-center mt-4">
        This invite expires in 7 days
      </p>
    </div>
  </div>
)}
```

### Invite Accept Page (`/invite/[token]`)

```tsx
<div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl p-8 max-w-md w-full border-2 border-stone-100">
    <div className="text-center mb-6">
      <div className="text-5xl mb-4">👥</div>
      <h1 className="text-2xl font-black text-stone-900 mb-2">
        Friend Invite
      </h1>
      <p className="text-stone-600">
        <strong>{senderName}</strong> wants to connect on Ring Ring
      </p>
    </div>
    
    {/* Device Selection */}
    <div className="mb-6">
      <p className="text-sm font-bold text-stone-900 mb-3">
        Which of your devices can connect?
      </p>
      <div className="space-y-2">
        {myDevices.map(device => (
          <label key={device.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-stone-200 hover:border-[#C4531A] cursor-pointer">
            <input
              type="checkbox"
              checked={selectedDevices.includes(device.id)}
              onChange={(e) => toggleDevice(device.id, e.target.checked)}
              className="w-5 h-5"
            />
            <span className="font-medium text-stone-900">{device.name}</span>
          </label>
        ))}
      </div>
    </div>
    
    {/* Accept Button */}
    <button
      onClick={acceptInvite}
      disabled={selectedDevices.length === 0}
      className="w-full px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Accept & Connect
    </button>
    
    {/* Safety Note */}
    <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
      <p className="text-xs text-blue-900">
        <strong>🔒 Safe & Private:</strong> Only selected devices will be able to call each other. You can remove this connection at any time.
      </p>
    </div>
  </div>
</div>
```

---

## API Implementation

### POST /api/friends/invite/create

```typescript
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const invite = await prisma.friendInvite.create({
    data: {
      senderUserId: session.user.id,
      inviteToken,
      expiresAt,
      status: 'pending',
    },
  });
  
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${inviteToken}`;
  
  return NextResponse.json({
    inviteToken,
    inviteUrl,
    expiresAt,
  });
}
```

### GET /api/friends/invite/[token]

```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.friendInvite.findUnique({
    where: { inviteToken: params.token },
    include: {
      sender: {
        select: { id: true, email: true, name: true },
      },
    },
  });
  
  if (!invite) {
    return new NextResponse('Invite not found', { status: 404 });
  }
  
  if (invite.status !== 'pending') {
    return new NextResponse('Invite already used', { status: 400 });
  }
  
  if (new Date() > invite.expiresAt) {
    return new NextResponse('Invite expired', { status: 400 });
  }
  
  return NextResponse.json({
    senderName: invite.sender.name || invite.sender.email,
    senderEmail: invite.sender.email,
  });
}
```

### POST /api/friends/invite/[token]/accept

```typescript
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  
  const { deviceIds } = await req.json();
  
  const invite = await prisma.friendInvite.findUnique({
    where: { inviteToken: params.token },
  });
  
  if (!invite || invite.status !== 'pending' || new Date() > invite.expiresAt) {
    return new NextResponse('Invalid invite', { status: 400 });
  }
  
  // Create friendship
  const [userA, userB] = [invite.senderUserId, session.user.id].sort();
  
  const friendship = await prisma.friendship.create({
    data: {
      userAId: userA,
      userBId: userB,
      createdFromInviteId: invite.id,
    },
  });
  
  // Add device permissions
  await prisma.friendDevicePermission.createMany({
    data: deviceIds.map((deviceId: string) => ({
      friendshipId: friendship.id,
      deviceId,
    })),
  });
  
  // Mark invite as accepted
  await prisma.friendInvite.update({
    where: { id: invite.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedByUserId: session.user.id,
    },
  });
  
  return NextResponse.json({ success: true, friendshipId: friendship.id });
}
```

---

## Security Considerations

### Token Security
- Use cryptographically secure random tokens (32 bytes)
- Tokens expire after 7 days
- One-time use (marked as 'accepted' after use)
- Cannot be reused or guessed

### Privacy
- QR code contains only invite token, no personal info
- Recipient must login to see sender's name
- No device info exposed until acceptance

### Validation
- Check invite exists and is pending
- Check invite not expired
- Check user owns selected devices
- Prevent self-friending
- Prevent duplicate friendships

---

## User Experience Enhancements

### In-Person Sharing (Primary Use Case)
**Scenario:** Parents meet at school pickup

1. Parent A: "Want to connect on Ring Ring?"
2. Opens app → Friends tab → "Create Invite"
3. Shows QR code on phone
4. Parent B: Scans with camera app
5. Opens Ring Ring → Accepts
6. Done! Kids can call each other

**Time:** < 30 seconds

### Email Sharing (Secondary)
**Scenario:** Parents don't see each other in person

1. Parent A creates invite
2. Clicks "Send via Email"
3. Enters Parent B's email
4. Parent B receives email with QR code
5. Clicks link or scans QR
6. Accepts invite

### Text/Messaging Sharing
**Scenario:** Parents text regularly

1. Parent A creates invite
2. Clicks "Copy Link"
3. Pastes in text message
4. Parent B clicks link
5. Accepts invite

---

## Success Confirmation

After acceptance, both parents see:

```
✅ Connection Successful!

You're now connected with [Parent Name].

Next steps:
1. Go to Contacts tab
2. Add their devices to your quick dial
3. Your kids can start calling!
```

---

## Future Enhancements

### Batch Invites
- Generate one QR code for multiple families
- Useful for classroom connections
- All parents scan same code

### Invite Analytics
- Track which invites are accepted
- See pending invites
- Resend expired invites

### Social Features
- See mutual friends
- Friend suggestions based on school/location
- Group invites for playdates
