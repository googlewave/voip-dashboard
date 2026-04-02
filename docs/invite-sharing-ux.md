# Modern Invite Sharing UX Design

## Three Primary Sharing Methods

### 1. 📱 QR Code (In-Person)
**Use case:** School pickup, playdates, in-person meetings
**Flow:** Show QR code → Other parent scans → Instant connection

### 2. 📧 Email Invite
**Use case:** Don't see parent in person, have their email
**Flow:** Enter email → Send invite → They click link in email

### 3. 💬 Text Message (SMS)
**Use case:** Already texting with other parent
**Flow:** Enter phone number → Send SMS → They click link in text

---

## Invite Modal UI Design

```tsx
// Parent clicks "Create Friend Invite" button
// Modal appears with 3 prominent sharing options

<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-black text-stone-900">Share Friend Invite</h2>
        <p className="text-sm text-stone-500 mt-1">Choose how to connect with another parent</p>
      </div>
      <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 text-2xl">
        ×
      </button>
    </div>

    {/* Three Sharing Methods - Equal Prominence */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      
      {/* QR Code */}
      <button
        onClick={() => setShareMethod('qr')}
        className={`p-6 rounded-2xl border-2 transition ${
          shareMethod === 'qr'
            ? 'border-[#C4531A] bg-orange-50'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="text-4xl mb-3">📱</div>
        <div className="font-black text-stone-900 mb-1">QR Code</div>
        <div className="text-xs text-stone-500">Show in person</div>
      </button>

      {/* Email */}
      <button
        onClick={() => setShareMethod('email')}
        className={`p-6 rounded-2xl border-2 transition ${
          shareMethod === 'email'
            ? 'border-[#C4531A] bg-orange-50'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="text-4xl mb-3">📧</div>
        <div className="font-black text-stone-900 mb-1">Email</div>
        <div className="text-xs text-stone-500">Send invite link</div>
      </button>

      {/* SMS */}
      <button
        onClick={() => setShareMethod('sms')}
        className={`p-6 rounded-2xl border-2 transition ${
          shareMethod === 'sms'
            ? 'border-[#C4531A] bg-orange-50'
            : 'border-stone-200 hover:border-stone-300'
        }`}
      >
        <div className="text-4xl mb-3">💬</div>
        <div className="font-black text-stone-900 mb-1">Text Message</div>
        <div className="text-xs text-stone-500">Send via SMS</div>
      </button>
    </div>

    {/* Dynamic Content Based on Selected Method */}
    <div className="bg-stone-50 rounded-2xl p-6 border-2 border-stone-200">
      
      {/* QR Code View */}
      {shareMethod === 'qr' && (
        <div className="text-center">
          <p className="text-sm font-bold text-stone-700 mb-4">
            Show this QR code to another parent
          </p>
          <div className="bg-white p-6 rounded-xl inline-block shadow-lg">
            <QRCodeSVG
              value={inviteUrl}
              size={220}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-xs text-stone-500 mt-4">
            They can scan with their phone camera
          </p>
          <div className="mt-6 pt-6 border-t border-stone-200">
            <p className="text-xs font-bold text-stone-600 mb-3">Or share the link:</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-stone-200 text-sm font-mono bg-white"
              />
              <button
                onClick={() => copyToClipboard(inviteUrl)}
                className="px-4 py-2 bg-stone-800 text-white font-bold rounded-lg hover:bg-stone-700 transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email View */}
      {shareMethod === 'email' && (
        <div>
          <p className="text-sm font-bold text-stone-700 mb-4">
            Send invite via email
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-2">
                Recipient's Email
              </label>
              <input
                type="email"
                placeholder="parent@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                placeholder="Hi! Let's connect our kids on Ring Ring..."
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none resize-none"
              />
            </div>
            <button
              onClick={sendEmailInvite}
              disabled={!recipientEmail || sending}
              className="w-full px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : '📧 Send Email Invite'}
            </button>
          </div>
          
          {/* Preview */}
          <div className="mt-6 p-4 bg-white rounded-xl border-2 border-stone-200">
            <p className="text-xs font-bold text-stone-600 mb-2">Email Preview:</p>
            <div className="text-xs text-stone-500 space-y-1">
              <p><strong>Subject:</strong> {yourName} invited you to Ring Ring</p>
              <p><strong>From:</strong> Ring Ring &lt;invites@ringring.com&gt;</p>
              <p className="pt-2 border-t border-stone-200 mt-2">
                {personalMessage || "Let's connect our kids on Ring Ring!"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SMS View */}
      {shareMethod === 'sms' && (
        <div>
          <p className="text-sm font-bold text-stone-700 mb-4">
            Send invite via text message
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-2">
                Recipient's Phone Number
              </label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-[#C4531A] outline-none"
              />
            </div>
            <button
              onClick={sendSmsInvite}
              disabled={!recipientPhone || sending}
              className="w-full px-6 py-3 bg-[#C4531A] text-white font-bold rounded-xl hover:bg-[#a84313] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : '💬 Send Text Message'}
            </button>
          </div>
          
          {/* Preview */}
          <div className="mt-6 p-4 bg-white rounded-xl border-2 border-stone-200">
            <p className="text-xs font-bold text-stone-600 mb-2">Message Preview:</p>
            <div className="text-xs text-stone-500">
              <p className="font-mono bg-stone-50 p-3 rounded-lg">
                {yourName} invited you to Ring Ring - a safe phone service for kids. 
                Accept invite: {inviteUrl.replace('https://', '')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Footer Info */}
    <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
      <p className="text-xs font-bold text-blue-900 mb-1">🔒 Safe & Private</p>
      <p className="text-xs text-blue-800">
        This invite expires in 7 days. Only the recipient can accept it. You can cancel anytime.
      </p>
    </div>
  </div>
</div>
```

---

## Email Template (Resend)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ring Ring Friend Invite</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #FAF7F2; padding: 40px 20px;">
  
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 24px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 28px; font-weight: 900; color: #1C1917; margin: 0 0 8px 0;">
        Ring Ring
      </h1>
      <p style="color: #78716C; font-size: 14px; margin: 0;">
        Safe, parent-supervised phone service for kids
      </p>
    </div>

    <!-- Invite Message -->
    <div style="background: #FFF7ED; border: 2px solid #C4531A; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
      <p style="font-size: 18px; font-weight: 700; color: #1C1917; margin: 0 0 12px 0;">
        👥 {{senderName}} invited you to connect
      </p>
      <p style="color: #57534E; font-size: 14px; margin: 0; line-height: 1.6;">
        {{personalMessage}}
      </p>
    </div>

    <!-- QR Code -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 12px; font-weight: 700; color: #57534E; margin: 0 0 16px 0;">
        SCAN WITH YOUR PHONE CAMERA
      </p>
      <div style="background: white; padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #E7E5E4;">
        <img src="{{qrCodeDataUrl}}" alt="QR Code" width="200" height="200" />
      </div>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 12px; color: #78716C; margin: 0 0 16px 0;">
        Or click the button below:
      </p>
      <a href="{{inviteUrl}}" style="display: inline-block; background: #C4531A; color: white; font-weight: 700; font-size: 16px; padding: 16px 32px; border-radius: 12px; text-decoration: none;">
        Accept Invite
      </a>
    </div>

    <!-- How It Works -->
    <div style="background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <p style="font-size: 12px; font-weight: 700; color: #1E3A8A; margin: 0 0 12px 0;">
        💡 How Ring Ring Works:
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #1E40AF; font-size: 12px; line-height: 1.8;">
        <li>Both parents approve the connection</li>
        <li>Kids can call each other safely</li>
        <li>No strangers, no surprises</li>
        <li>You control everything</li>
      </ul>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 24px; border-top: 2px solid #E7E5E4;">
      <p style="color: #A8A29E; font-size: 11px; margin: 0 0 8px 0;">
        This invite expires in 7 days
      </p>
      <p style="color: #A8A29E; font-size: 11px; margin: 0;">
        Questions? Reply to this email or visit ringring.com/help
      </p>
    </div>

  </div>

</body>
</html>
```

---

## SMS Template (Twilio)

```typescript
const smsMessage = `
${senderName} invited you to Ring Ring - a safe phone service for kids.

Accept invite: ${shortUrl}

Ring Ring lets kids call approved friends safely. Both parents must approve.

Reply STOP to opt out
`.trim();
```

**Note:** SMS should be concise due to character limits. Use URL shortener for cleaner look.

---

## API Endpoints

### POST /api/friends/invite/send-email

```typescript
{
  recipientEmail: string,
  personalMessage?: string
}
```

**Response:**
```typescript
{
  success: true,
  inviteId: string,
  sentTo: string
}
```

### POST /api/friends/invite/send-sms

```typescript
{
  recipientPhone: string
}
```

**Response:**
```typescript
{
  success: true,
  inviteId: string,
  sentTo: string
}
```

---

## Implementation with Resend (Email)

```typescript
import { Resend } from 'resend';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailInvite(
  senderName: string,
  recipientEmail: string,
  inviteUrl: string,
  personalMessage?: string
) {
  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(inviteUrl, {
    width: 200,
    margin: 2,
  });

  const { data, error } = await resend.emails.send({
    from: 'Ring Ring <invites@ringring.com>',
    to: recipientEmail,
    subject: `${senderName} invited you to Ring Ring`,
    html: renderEmailTemplate({
      senderName,
      personalMessage: personalMessage || "Let's connect our kids on Ring Ring!",
      inviteUrl,
      qrCodeDataUrl,
    }),
  });

  if (error) throw error;
  return data;
}
```

---

## Implementation with Twilio (SMS)

```typescript
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSmsInvite(
  senderName: string,
  recipientPhone: string,
  inviteUrl: string
) {
  // Shorten URL for SMS (optional but recommended)
  const shortUrl = await shortenUrl(inviteUrl);

  const message = await twilioClient.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to: recipientPhone,
    body: `${senderName} invited you to Ring Ring - a safe phone service for kids.\n\nAccept invite: ${shortUrl}\n\nRing Ring lets kids call approved friends safely. Both parents must approve.`,
  });

  return message;
}
```

---

## URL Shortener (Optional)

```typescript
// Simple internal shortener
export async function shortenUrl(longUrl: string): Promise<string> {
  const shortCode = generateShortCode(); // e.g., "abc123"
  
  await prisma.shortUrl.create({
    data: {
      shortCode,
      longUrl,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  
  return `${process.env.NEXT_PUBLIC_BASE_URL}/i/${shortCode}`;
}

// Redirect handler: /i/[code]
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const shortUrl = await prisma.shortUrl.findUnique({
    where: { shortCode: params.code },
  });
  
  if (!shortUrl || new Date() > shortUrl.expiresAt) {
    return redirect('/invite-expired');
  }
  
  return redirect(shortUrl.longUrl);
}
```

---

## User Flow Examples

### Scenario 1: School Pickup (QR Code)
1. Parent A: "Want to connect on Ring Ring?"
2. Opens app → Friends → Create Invite
3. Selects "QR Code" tab
4. Shows phone to Parent B
5. Parent B scans with camera
6. Opens invite page → Accepts
7. **Time: 20 seconds**

### Scenario 2: Email (Remote)
1. Parent A creates invite
2. Selects "Email" tab
3. Enters parent@example.com
4. Adds message: "Hi Sarah! Let's connect Emma and Lily"
5. Clicks "Send Email Invite"
6. Parent B receives email
7. Clicks "Accept Invite" button
8. Accepts on website
9. **Time: 2 minutes**

### Scenario 3: Text Message (Quick)
1. Parent A creates invite
2. Selects "Text Message" tab
3. Enters (555) 123-4567
4. Clicks "Send Text Message"
5. Parent B receives SMS
6. Clicks link
7. Accepts invite
8. **Time: 1 minute**

---

## Analytics Tracking

```typescript
// Track which sharing method is most popular
await prisma.inviteAnalytics.create({
  data: {
    inviteId: invite.id,
    shareMethod: 'qr' | 'email' | 'sms',
    sentAt: new Date(),
  },
});

// Track acceptance rate by method
await prisma.inviteAnalytics.update({
  where: { inviteId: invite.id },
  data: {
    acceptedAt: new Date(),
    acceptedVia: 'qr_scan' | 'email_link' | 'sms_link',
  },
});
```

---

## Cost Considerations

### Email (Resend)
- **Cost:** $0 for first 3,000/month, then $0.001 per email
- **Delivery:** ~99% success rate
- **Speed:** Instant

### SMS (Twilio)
- **Cost:** ~$0.0075 per SMS (US)
- **Delivery:** ~98% success rate
- **Speed:** Instant

### QR Code
- **Cost:** $0 (generated client-side)
- **Delivery:** 100% (shown in person)
- **Speed:** Instant

**Recommendation:** Encourage QR code for in-person, email for remote. SMS as premium option or paid plan feature.

---

## Success Metrics

**Target Metrics:**
- QR code usage: 60% (in-person is primary)
- Email usage: 30% (remote connections)
- SMS usage: 10% (convenience)
- Overall acceptance rate: >70%
- Time to accept: <24 hours

**A/B Testing:**
- Test different email subject lines
- Test QR code size and placement
- Test SMS message wording
- Optimize for highest acceptance rate
