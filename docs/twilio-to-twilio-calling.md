# Twilio-to-Twilio Calling Strategy

## Business Model

**Free Plan:** Ring Ring to Ring Ring calling (SIP-to-SIP, no PSTN charges)
**Paid Plan:** Adds ability to call regular phone numbers (PSTN)

---

## How It Works

### Ring Ring Friend (Free)
```
Device A (Kitchen Phone)
  ↓
Dials: sip_abc123_1234567890 (friend's SIP username)
  ↓
Twilio SIP Domain routes directly to Device B
  ↓
Device B (Emma's Phone) rings
  ↓
Cost: $0 (pure SIP-to-SIP)
```

### Regular Phone Number (Paid Plan)
```
Device A (Kitchen Phone)
  ↓
Dials: +12035551234 (PSTN number)
  ↓
Twilio converts SIP to PSTN
  ↓
Regular phone rings
  ↓
Cost: ~$0.01/min (Twilio PSTN charges)
```

---

## Contact Data Model

### Updated Contact Schema

```typescript
interface Contact {
  id: string;
  name: string;
  
  // For Ring Ring friends (Twilio-to-Twilio)
  friendshipId?: string;
  friendDeviceId?: string;
  sipUsername?: string; // e.g., sip_abc123_1234567890
  
  // For PSTN numbers (paid plan only)
  phoneNumber?: string; // e.g., +12035551234
  
  // Quick dial
  quickDialSlot?: number; // 1-9
  
  // Type indicator
  contactType: 'ring_ring_friend' | 'phone_number';
}
```

### Database Migration

```sql
-- Add new columns to contacts table
ALTER TABLE contacts ADD COLUMN friendship_id TEXT REFERENCES friendships(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN friend_device_id TEXT REFERENCES devices(id) ON DELETE CASCADE;
ALTER TABLE contacts ADD COLUMN sip_username TEXT;
ALTER TABLE contacts ADD COLUMN contact_type TEXT NOT NULL DEFAULT 'phone_number';

-- Rename phone column to phone_number for clarity
ALTER TABLE contacts RENAME COLUMN phone TO phone_number;

-- Add constraint: must have either sip_username OR phone_number
ALTER TABLE contacts ADD CONSTRAINT contact_must_have_identifier 
  CHECK (
    (contact_type = 'ring_ring_friend' AND sip_username IS NOT NULL) OR
    (contact_type = 'phone_number' AND phone_number IS NOT NULL)
  );

-- Index for fast lookups
CREATE INDEX idx_contacts_friendship ON contacts(friendship_id);
CREATE INDEX idx_contacts_sip_username ON contacts(sip_username);
```

---

## Quick Dial Integration

### Updated Quick Dial Display

```tsx
// Ring Ring Friend
<div className="aspect-square rounded-full bg-gradient-to-br from-[#C4531A] to-[#a84313]">
  <div className="text-3xl font-black text-white">1</div>
  <div className="text-xs font-bold text-white/90">Emma</div>
  <div className="text-[10px] text-white/70">Ring Ring Friend</div>
  {/* Hidden: SIP username for dialing */}
</div>

// Phone Number (Paid Plan)
<div className="aspect-square rounded-full bg-gradient-to-br from-blue-600 to-blue-800">
  <div className="text-3xl font-black text-white">2</div>
  <div className="text-xs font-bold text-white/90">Grandma</div>
  <div className="text-[10px] text-white/70">(203) 555-1234</div>
</div>
```

### Visual Distinction

**Ring Ring Friends:** Orange gradient (brand color)
**Phone Numbers:** Blue gradient (different color to distinguish)

---

## Device Provisioning Configuration

### Linksys SPA2102 Config

**Speed Dial Configuration:**
```xml
<!-- Speed dial 1: Ring Ring friend (SIP username) -->
<Speed_Dial_2>sip_abc123_1234567890@ringringclub.sip.twilio.com</Speed_Dial_2>

<!-- Speed dial 2: Phone number (PSTN) -->
<Speed_Dial_3>12035551234</Speed_Dial_3>
```

**Dial Plan:**
```xml
<!-- Allow SIP usernames (sip_*) and phone numbers -->
<Dial_Plan_1>(sip_*@ringringclub.sip.twilio.com|[2-9]xxxxxxxxx|1[2-9]xxxxxxxxx|911)</Dial_Plan_1>
```

### Grandstream HT801 Config

**Speed Dial Configuration:**
```xml
<!-- Speed dial 1: Ring Ring friend -->
<P1364>sip_abc123_1234567890@ringringclub.sip.twilio.com</P1364>

<!-- Speed dial 2: Phone number -->
<P1365>12035551234</P1365>
```

**Dial Plan:**
```xml
<!-- Allow SIP usernames and phone numbers -->
<P290>{sip_*@ringringclub.sip.twilio.com|[2-9]xxxxxxxxx|1[2-9]xxxxxxxxx|911}</P290>
```

---

## Friend Invite Flow (Updated)

### When Friendship is Accepted

1. Parent B accepts invite
2. Parent B selects which devices can connect
3. System creates friendship record
4. **Both parents can now add each other's devices as contacts**

### Adding Friend's Device as Contact

**Parent A's view:**
```
Approved Friends:
  └─ Sarah (Parent B)
     ├─ Kitchen Phone (sip_xyz789_1234567890) [Add to Quick Dial]
     └─ Playroom Phone (sip_def456_1234567891) [Add to Quick Dial]
```

**Click "Add to Quick Dial":**
1. Select quick dial slot (1-9)
2. Contact created with:
   - name: "Emma (Kitchen Phone)"
   - contactType: 'ring_ring_friend'
   - sipUsername: 'sip_xyz789_1234567890'
   - friendshipId: [friendship ID]
   - friendDeviceId: [device ID]
   - quickDialSlot: 1

---

## API Updates

### GET /api/friends/:friendshipId/devices

**Returns friend's devices that can be added as contacts:**

```typescript
{
  friendship: {
    id: string,
    friendName: string,
    friendEmail: string,
  },
  devices: [
    {
      id: string,
      name: string,
      sipUsername: string,
      isOnline: boolean,
    }
  ]
}
```

### POST /api/contacts

**Updated to support both contact types:**

```typescript
{
  deviceId: string, // My device
  name: string,
  quickDialSlot?: number,
  
  // For Ring Ring friend
  contactType: 'ring_ring_friend',
  friendshipId: string,
  friendDeviceId: string,
  sipUsername: string,
  
  // OR for phone number (paid plan)
  contactType: 'phone_number',
  phoneNumber: string,
}
```

---

## Twilio Call Routing

### Webhook Logic

```typescript
// /api/twilio/voice
export async function POST(req: NextRequest) {
  const { From, To } = await req.json();
  
  // From: sip_abc123_1234567890@ringringclub.sip.twilio.com
  // To: Could be SIP username OR phone number
  
  const fromUsername = From.split('@')[0];
  const toIdentifier = To.split('@')[0];
  
  // Check if To is a SIP username (Ring Ring friend)
  if (toIdentifier.startsWith('sip_')) {
    // Twilio-to-Twilio call (FREE)
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial>
          <Sip>${toIdentifier}@ringringclub.sip.twilio.com</Sip>
        </Dial>
      </Response>
    `;
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } else {
    // PSTN call (PAID PLAN REQUIRED)
    // Check if caller has paid plan
    const device = await getDeviceBySipUsername(fromUsername);
    const user = await getUserByDeviceId(device.id);
    
    if (user.plan === 'free') {
      // Block PSTN calls on free plan
      const twiml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say>This call requires a paid plan. Please upgrade to call phone numbers.</Say>
          <Hangup/>
        </Response>
      `;
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' }
      });
    }
    
    // Allow PSTN call
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Dial callerId="${user.twilioNumber}">
          <Number>${To}</Number>
        </Dial>
      </Response>
    `;
    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
```

---

## Cost Analysis

### Free Plan (Ring Ring to Ring Ring)

**Scenario:** 2 families, 4 devices, 100 calls/month

**Costs:**
- SIP registration: $0 (included)
- SIP-to-SIP calls: $0 (no PSTN)
- Storage/bandwidth: ~$0.01/month

**Total: ~$0.01/month per user**

### Paid Plan (Adds PSTN Calling)

**Scenario:** Same as above + 50 PSTN calls/month (avg 5 min each)

**Costs:**
- Phone number: $1/month
- SIP-to-SIP calls: $0
- PSTN calls: 50 calls × 5 min × $0.013/min = $3.25/month
- Storage/bandwidth: ~$0.01/month

**Total: ~$4.26/month**
**Revenue: $8.95/month**
**Margin: $4.69/month (52%)**

---

## User Experience

### Free Plan User Journey

1. Sign up for Ring Ring (free)
2. Add device (Kitchen Phone)
3. Send friend invite to another parent
4. Friend accepts
5. Add friend's device to quick dial slot 1
6. Kid presses and holds "1" on phone
7. Calls friend instantly (free, SIP-to-SIP)

### Paid Plan User Journey

1. Upgrade to paid plan ($8.95/month)
2. Get phone number provisioned
3. Can now add both:
   - Ring Ring friends (free, SIP-to-SIP)
   - Phone numbers (grandma, dad's cell, etc.)
4. Quick dial shows both types
5. All calls work seamlessly

---

## UI Updates Needed

### Contact List Display

```tsx
{contacts.map(contact => (
  <div key={contact.id} className="flex items-center gap-3">
    {/* Icon based on type */}
    {contact.contactType === 'ring_ring_friend' ? (
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="text-orange-600">👥</span>
      </div>
    ) : (
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-blue-600">📞</span>
      </div>
    )}
    
    {/* Name and identifier */}
    <div>
      <p className="font-bold">{contact.name}</p>
      <p className="text-sm text-stone-500">
        {contact.contactType === 'ring_ring_friend' 
          ? 'Ring Ring Friend' 
          : formatPhoneNumber(contact.phoneNumber)}
      </p>
    </div>
    
    {/* Quick dial slot */}
    {contact.quickDialSlot && (
      <span className="ml-auto w-8 h-8 rounded-full bg-[#C4531A] text-white font-bold flex items-center justify-center">
        {contact.quickDialSlot}
      </span>
    )}
  </div>
))}
```

### Add Contact Flow

```tsx
<div className="space-y-4">
  {/* Tab selector */}
  <div className="flex gap-2">
    <button
      onClick={() => setContactType('ring_ring_friend')}
      className={`flex-1 px-4 py-3 rounded-xl font-bold ${
        contactType === 'ring_ring_friend'
          ? 'bg-[#C4531A] text-white'
          : 'bg-stone-100 text-stone-600'
      }`}
    >
      👥 Ring Ring Friend (Free)
    </button>
    <button
      onClick={() => setContactType('phone_number')}
      disabled={!isPaidPlan}
      className={`flex-1 px-4 py-3 rounded-xl font-bold ${
        contactType === 'phone_number' && isPaidPlan
          ? 'bg-blue-600 text-white'
          : 'bg-stone-100 text-stone-400'
      }`}
    >
      📞 Phone Number {!isPaidPlan && '(Paid Plan)'}
    </button>
  </div>
  
  {/* Ring Ring Friend selector */}
  {contactType === 'ring_ring_friend' && (
    <select className="w-full px-4 py-3 rounded-xl border-2">
      <option value="">Select a friend's device</option>
      {approvedFriends.map(friend => (
        <optgroup key={friend.id} label={friend.name}>
          {friend.devices.map(device => (
            <option key={device.id} value={device.id}>
              {device.name} ({device.sipUsername})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )}
  
  {/* Phone number input */}
  {contactType === 'phone_number' && (
    <input
      type="tel"
      placeholder="Phone number"
      className="w-full px-4 py-3 rounded-xl border-2"
    />
  )}
</div>
```

---

## Implementation Checklist

- [ ] Update database schema (add columns to contacts)
- [ ] Update Prisma schema
- [ ] Create migration SQL
- [ ] Update contact creation API
- [ ] Update device provisioning config generation
- [ ] Update quick dial display to show contact type
- [ ] Add friend device selector to contact form
- [ ] Update Twilio webhook to route SIP-to-SIP calls
- [ ] Add plan validation for PSTN calls
- [ ] Test Twilio-to-Twilio calling
- [ ] Test PSTN blocking on free plan
- [ ] Deploy and verify

---

## Testing Plan

### Test 1: Free Plan SIP-to-SIP Call
1. Create 2 free plan accounts
2. Send friend invite, accept
3. Add friend's device to quick dial
4. Provision both devices
5. Press quick dial button
6. **Expected:** Call connects, $0 cost

### Test 2: Free Plan PSTN Block
1. Free plan account
2. Try to add phone number contact
3. **Expected:** Blocked or grayed out
4. Try to dial phone number directly
5. **Expected:** "Upgrade required" message

### Test 3: Paid Plan Mixed Contacts
1. Paid plan account
2. Add Ring Ring friend (SIP)
3. Add phone number (PSTN)
4. Test both calls
5. **Expected:** Both work, SIP call is free

---

## Benefits

### For Users
- ✅ Free calling between Ring Ring families
- ✅ Simple upgrade path to call anyone
- ✅ Clear visual distinction between contact types
- ✅ No surprise charges

### For Ring Ring
- ✅ Low cost to serve free plan users (~$0.01/month)
- ✅ Strong conversion incentive (add grandma, dad's cell)
- ✅ Healthy margins on paid plans (52%)
- ✅ Scalable infrastructure
