# Ring Ring — Implementation Status

> Last updated: April 2026 (session 14+)  
> Production: https://voip-dashboard-sigma.vercel.app

---

## ✅ Fully Implemented & Live

### Database Schema
- ✅ `friend_invites`, `friendships`, `friend_device_permissions` tables
- ✅ `contacts` table with `contact_type`, `sip_username`, `friend_device_id`, `friendship_id`
- ✅ `users` table extended: `e911_name/street/city/state/zip`, `two_factor_enabled`, `otp`, `otp_expires_at`, `twilio_number_sid`
- ✅ `devices` table extended: `phone_number` (linked line, backfilled for existing devices), provisioning tracking fields

### Parent Portal — Devices Tab
- ✅ Phone line (`phone_number`) shown per device in blue monospace
- ✅ Device auto-assigns current user line on creation
- ✅ Existing 4 devices backfilled with user's `twilio_number` via migration
- ✅ Inline per-device Settings panel (kill switch, quiet hours, usage cap) — paid gating
- ✅ Setup Guide button only shown when SIP credentials exist (no confusing pending state)
- ✅ Contacts button jumps to Contacts tab with device pre-selected

### Parent Portal — Contacts Tab
- ✅ Inline device picker when no device selected (clickable cards with phone line + contact count)
- ✅ No more "Go to Devices tab" dead-end message
- ✅ Multi-device switcher shown only when >1 device exists
- ✅ Ring Ring Friend contacts (SIP-to-SIP) + Phone Number contacts (PSTN, paid)
- ✅ Safe Dial Dashboard — drag-and-drop quick dial slots 1–9

### Parent Portal — Friends Tab
- ✅ Create Friend Invite (QR code + copy link + email/SMS share)
- ✅ Connected families list with device count
- ✅ Pending outbound invites list
- ✅ `/invite/[token]` acceptance page

### Parent Portal — Phone Lines Tab (formerly Subscription)
- ✅ Renamed from "Subscription" → "Phone Lines"
- ✅ **Free / Friends & Family** tier card — clearly explains no billing, Ring Ring-to-Ring Ring only, upgrade CTA
- ✅ Paid users: Active Lines from Stripe subscriptions API + profile fallback
- ✅ Per-line phone number shown in blue monospace
- ✅ **E911 Emergency Address** moved inside each line entry (collapsible, shows current address or "Not set" badge)
- ✅ **Two-step cancel confirmation** — Cancel → inline "Are you sure?" → "Yes, cancel my line" / "Keep my line"
- ✅ Cancel for Stripe users: `POST /api/billing/cancel-subscription` (period end)
- ✅ Cancel for non-Stripe users: `POST /api/billing/cancel-number` (releases Twilio number, resets plan to free)
- ✅ "What's included" feature grid

### Parent Portal — Settings Tab
- ✅ Account section: change email, change password
- ✅ Two-Factor Authentication toggle (email OTP via Resend)
- ✅ Device-specific settings fully removed (moved to Devices tab inline panel)
- ✅ E911 fully removed (moved to Phone Lines tab per-line)

### Two-Factor Authentication (2FA)
- ✅ `POST /api/auth/send-otp` — generates 6-digit OTP, stores with 10-min expiry, emails via Resend
- ✅ `POST /api/auth/verify-otp` — validates OTP, clears on success
- ✅ `/verify-2fa` page — OTP input, resend button, error handling
- ✅ `SiteGuard` enhanced — checks `two_factor_enabled` on every protected page load, redirects to `/verify-2fa` if unverified
- ✅ Session marked via `sessionStorage` to avoid re-prompting within same session

### Billing API
- ✅ `GET /api/billing/subscriptions` — fetches user's active Stripe subscriptions
- ✅ `POST /api/billing/cancel-subscription` — cancels at period end
- ✅ `POST /api/billing/cancel-number` — non-Stripe path: releases Twilio number via API, nulls out DB fields

### Admin Portal
- ✅ Add Device modal includes **Phone Line selector** (pre-populated with user's `twilioNumber`)
- ✅ Device rows show linked phone number (blue) or "No line" (amber) in secondary info line
- ✅ `phoneNumber` field sent through `POST /api/devices/create` and stored in DB

### Device–Line Architecture
- ✅ `phone_number` column on `devices` table (was already in Prisma schema at field level)
- ✅ DB migration ran: `ALTER TABLE devices ADD COLUMN IF NOT EXISTS phone_number TEXT`
- ✅ Backfill: `UPDATE devices SET phone_number = users.twilio_number WHERE user_id = users.id`
- ✅ New devices auto-assigned line at creation (parent portal + admin portal)

---

## 🚧 Known Gaps / Future Work

### Per-Line E911 (DB level)
- Currently E911 fields are on the `users` table (one set per user)
- UI already shows E911 per-line in Phone Lines tab
- When multiple lines per user are supported, each line will need its own E911 record (requires a `lines` table or moving E911 to a junction table)

### Multiple Lines Per User (Architecture)
- Current: one `twilio_number` + one `stripe_sub_id` on `users` table
- Future: dedicated `lines` table with `user_id`, `twilio_number`, `stripe_sub_id`, `e911_*` per row
- Device `phone_number` field already prepared for this

### SMS Invite Sending
- `POST /api/friends/invite/send-sms` not yet built
- Can use existing Twilio client

### Call Log UI
- `CallLog` table exists and is written to
- No parent-facing call history UI yet

---

## 📋 Environment Variables Required

```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_SIP_DOMAIN=ringringclub.sip.twilio.com
TWILIO_SIP_CRED_LIST_SID=CL...
STRIPE_SECRET_KEY
STRIPE_PRICE_ID
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
NEXT_PUBLIC_BASE_URL=https://voip-dashboard-sigma.vercel.app
NEXT_PUBLIC_SITE_PASSWORD
RESEND_API_KEY
```

---

## 🎯 Recommended Next Steps

1. **Multiple lines architecture** — create `lines` table, migrate `twilio_number` + `stripe_sub_id` + E911 fields off `users`
2. **Call log UI** — show call history per device in Devices tab
3. **SMS invite sending** — `POST /api/friends/invite/send-sms`
4. **Admin: edit device phone line** — allow reassigning a device to a different line post-creation
