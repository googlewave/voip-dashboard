# Ring Ring — Functionality Map

> Last updated: April 2026 (session 14+)  
> Stack: Next.js (App Router) · Supabase (Auth + PostgreSQL) · Prisma · Twilio · Stripe · Vercel

---

## Table of Contents

1. [Pages & Routes](#pages--routes)
2. [User Dashboard](#user-dashboard)
3. [Admin Dashboard](#admin-dashboard)
4. [API Routes](#api-routes)
5. [Call Routing Logic](#call-routing-logic)
6. [Device Provisioning](#device-provisioning)
7. [Friend System](#friend-system)
8. [Billing & Subscriptions](#billing--subscriptions)
9. [Database Schema (Summary)](#database-schema-summary)
10. [Plans & Pricing](#plans--pricing)
11. [Hardware](#hardware)
12. [Infrastructure & Integrations](#infrastructure--integrations)

---

## Pages & Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Root redirect |
| `/gate` | `app/gate/page.tsx` | Password gate — private beta access via `NEXT_PUBLIC_SITE_PASSWORD` |
| `/landing` | `app/landing/page.tsx` | Marketing / homepage |
| `/login` | `app/login/page.tsx` | Supabase email/password authentication |
| `/buy` | `app/buy/page.tsx` | 4-step purchase funnel (hardware → plan → delivery → checkout) |
| `/billing` | `app/billing/page.tsx` | Legacy billing page (Stripe checkout / portal) |
| `/dashboard` | `app/dashboard/page.tsx` | Main parent portal (7 tabs) |
| `/verify-2fa` | `app/verify-2fa/page.tsx` | Email OTP verification page for 2FA |
| `/invite/[token]` | `app/invite/[token]/page.tsx` | Friend invite accept flow |
| `/welcome` | `app/welcome/page.tsx` | Post-signup welcome page |
| `/portal-select` | `app/portal-select/page.tsx` | Choose between User Dashboard and Admin Portal |
| `/admin` | `app/admin/page.tsx` | Admin dashboard (5 tabs) |

---

## User Dashboard

**Path:** `/dashboard`  
**Auth:** Supabase session required — redirects to `/login` if unauthenticated

### Tabs

#### Devices Tab
- Add device by name → creates DB record, auto-assigns current phone line (`phone_number`), immediately shows provisioning modal
- List all devices showing: phone line (blue monospace), online/offline badge, contact count, quiet hours / usage cap indicators
- **Phone line** displayed per-device (linked at creation; backfilled for existing devices)
- **Setup** button → QR code provisioning modal with auto-provisioning URL (only shown once SIP credentials exist)
- **Contacts** button → jumps to Contacts tab with that device pre-selected
- **Settings** button → toggles inline per-device settings panel:
  - 🔴 Digital Kill Switch (toggle online/offline)
  - 🌙 Quiet Hours (paid only) — enable, set start/end time
  - ⏱️ Daily Usage Cap (paid only) — enable, set minutes/day
- Delete device (also deletes all associated contacts)

#### Contacts Tab
- **Inline device picker** when no device is pre-selected — shows clickable list of device cards (name, phone line, contact count, online status); no need to visit Devices tab first
- When device selected and multiple devices exist: compact switcher dropdown at top
- **Safe Dial Dashboard** — dark UI showing 9 numbered quick-dial slots (keys 1–9)
  - Drag-and-drop contacts from list onto slot grid
  - Slot conflict → swap confirmation modal
  - Active dial count (X / 9)
- Add Contact form with two modes:
  - **Ring Ring Friend** (free) — select from connected friend devices
  - **Phone Number** (paid plan only) — enter PSTN number
- Quick dial slot assignment (1–9) or no slot
- Contact list with slot assignment dropdown and remove button

#### Friends Tab
- View all connected families with their device count and status
- View pending outbound invites (token + expiry)
- **Create Friend Invite** button — generates unique 64-char hex token, 7-day expiry
- Invite modal with:
  - QR code (220×220, error correction H)
  - Copy link button
  - Share via Email (mailto link)
  - Share via SMS (sms: link)
  - Safety note (expires in 7 days, recipient-only)

#### Phone Lines Tab (formerly Subscription)
**Free / Friends & Family users:**
- "👋 Ring Ring Free Plan — Friends & Family" info card explaining no billing, Ring Ring-to-Ring Ring only
- Upgrade CTA card → `/buy`

**Paid users (monthly or annual):**
- Active Lines list (from Stripe subscriptions API or profile fallback)
  - Per line: amount/interval, status badge, phone number, renewal date
  - **🚨 E911 Emergency Address** — collapsible per-line section:
    - Shows current address summary inline when set; "Not set" amber badge when missing
    - Edit form (name, street, city, state, ZIP) with save button
  - **Cancel** button → two-step inline confirmation:
    - Step 1: Cancel button appears
    - Step 2: Confirmation panel with "Yes, cancel my line" / "Keep my line"
    - For Stripe users: calls `cancelSubscription` (keeps active until period end)
    - For non-Stripe users: calls `cancelNumber` → releases Twilio number, resets plan to free
- "+ Add another line" → navigates to Store tab
- "What's included on every line" feature grid

#### Settings Tab
- **Account** — change email address, change password
- **Two-Factor Authentication** — toggle email OTP on sign-in (sends 6-digit code via Resend)

### Provisioning Modal (Dashboard)
- QR code pointing to `https://voip-dashboard-sigma.vercel.app/api/provision/auto/{deviceId}`
- Manual URL display with copy button
- Step-by-step setup instructions

### 2FA Flow
1. User enables 2FA toggle in Settings tab → stored as `two_factor_enabled = true`
2. On next login, `SiteGuard` checks Supabase for `two_factor_enabled`
3. If enabled and session not yet verified → redirects to `/verify-2fa`
4. `/verify-2fa` page: calls `POST /api/auth/send-otp` (generates 6-digit OTP, saves to DB with 10-min expiry, sends email via Resend)
5. User submits code → `POST /api/auth/verify-otp` (validates, clears OTP)
6. On success → `sessionStorage.setItem('2fa_verified_{userId}', '1')` → redirect to dashboard

---

## Admin Dashboard

**Path:** `/admin`  
**Auth:** Supabase session + admin check  
**Entry point:** `/portal-select` — routes to either `/dashboard` or `/admin`

### Tabs

#### My Account Tab
- Admin's personal devices and contacts (same capabilities as user dashboard)
- Safe Dial Dashboard for own devices (drag-and-drop, slot swap modal)
- Add/delete own devices and contacts

#### Users Tab
- List all users with plan badge and Twilio number
- **Create User** — email, password, plan (free/monthly/annual) → calls `/api/admin/create-user`
- **Change Plan** — inline dropdown per user → calls `/api/admin/update-user-plan`
- **Provision Phone Number** — modal with:
  - Area code
  - Customer name
  - E911 address (street, city, state, ZIP)
  - Calls `/api/admin/provision-number` (buys Twilio number + registers E911)
- **Manual Billing** — modal with plan override, optional charge amount, note field → calls `/api/admin/manual-billing` (bypasses Stripe)
- **View Devices** — inline expansion showing user's devices

#### Users Tab (expanded)
- Per user: plan badge, Twilio number, device count
- **+ Add Device** → modal with:
  - Device name, adapter type (Grandstream/Linksys/Other)
  - **Phone Line** selector — auto-populated with user's `twilioNumber`; shows "No phone line provisioned yet" if none
  - MAC address (optional)
- Device rows show: phone number (blue monospace), SIP status, MAC, contact count

#### All Devices Tab
- All devices across all users
- Device row secondary line shows: linked **phone number** (blue monospace) or "No line" (amber), SIP credentials, MAC, contact count
- Expand device row to reveal:
  - SIP credentials (username, password, domain)
  - Device info (ID, type, MAC address, IP)
  - Quick dial slot grid (9 slots)
  - Unslotted contacts list
- Per-device actions:
  - Toggle online/offline
  - **Create SIP** — generates Twilio credential + saves to DB
  - **Reset SIP** — regenerates credentials
  - **QR Code** — provisioning modal with auto-provision URL
  - **Copy URL** — copies provisioning URL to clipboard
  - **Edit** — name, adapter type (Grandstream/Linksys/Other), MAC address
  - **Delete** — removes device and contacts

#### Billing Tab
- Stats cards: total users, paid plans, free plans
- Full user list with plan labels and Stripe customer IDs
- Manual Billing button per user

#### System Tab
- **SIP Cleanup** — removes orphaned Twilio SIP credentials not tied to active devices → calls `/api/admin/sip/cleanup`
- **System Stats** panel: total users, total devices, total contacts, online devices, SIP-provisioned count
- Admin notes (operational reminders)

---

## API Routes

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| — | Supabase Auth | Email/password sign-in, session management |
| POST | `/api/auth/send-otp` | Generate 6-digit OTP, save to DB with 10-min expiry, email via Resend |
| POST | `/api/auth/verify-otp` | Verify OTP, clear from DB on success |

### Devices
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/devices/create` | Create device record |
| POST | `/api/devices/[deviceId]/edit` | Edit device name, MAC address, adapter type |

### SIP Credentials
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/sip/create-user` | Generate Twilio SIP credential, save to DB + `sipCredential` table |
| POST | `/api/sip/reset` | Delete old + generate new Twilio SIP credential |
| GET | `/api/sip/credentials/[deviceId]` | Fetch SIP credentials for a device |
| GET | `/api/sip/config/[deviceId]` | Get full SIP config |
| GET | `/api/sip/debug-lookup` | Debug SIP credential lookup |
| POST | `/api/sip/force-update` | Force-push SIP config update |
| POST | `/api/sip/provision` | Provision SIP for device |
| POST | `/api/sip/sync-password` | Sync password between Twilio and DB |

### Provisioning
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/provision/auto/[deviceId]` | **Primary auto-provision endpoint** — detects device type, creates SIP creds if needed, returns XML config, logs to `ProvisioningLog` |
| GET | `/api/provision/[deviceId]/grandstream.cfg` | Grandstream HT801 XML config |
| GET | `/api/provision/[deviceId]/linksys.cfg` | Linksys SPA2102 XML config |
| GET | `/api/provision/mac/[macAddress]` | MAC address-based device lookup + config |
| GET | `/api/provision/debug` | Debug provisioning endpoint |
| GET | `/api/provision/firmware` | Firmware endpoint |
| GET | `/api/provision/test` | Test provisioning response |

### Call Routing (TwiML)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/twiml/route` | **Main Twilio voice webhook** — routes SIP-to-SIP and PSTN calls (see [Call Routing Logic](#call-routing-logic)) |
| POST | `/api/twilio/voice` | Legacy Twilio voice handler |
| POST | `/api/voip/inbound-call` | Inbound call handler |

### Friends
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/friends` | List friendships + pending sent invites |
| POST | `/api/friends/invite/create` | Generate invite token (7-day expiry) |
| GET | `/api/friends/invite/[token]` | Fetch invite details (sender email, validity) |
| POST | `/api/friends/invite/[token]/accept` | Accept invite, create friendship + device permissions |

### Stripe / Billing
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/stripe/checkout` | Create Stripe Checkout session (subscription) |
| POST | `/api/stripe/portal` | Create Stripe Customer Portal session |
| POST | `/api/stripe/webhook` | Handle `checkout.session.completed` and `customer.subscription.deleted` events |
| POST | `/api/buy/checkout` | Full onboarding checkout (new account + hardware + plan) |
| POST | `/api/billing/create-checkout` | Legacy billing checkout |
| GET | `/api/billing/subscriptions` | Fetch authenticated user's active Stripe subscriptions |
| POST | `/api/billing/cancel-subscription` | Cancel a Stripe subscription at period end |
| POST | `/api/billing/cancel-number` | For non-Stripe users: release Twilio number + reset plan to free |

### User
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/user/plan` | Get current user's plan |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/data` | Fetch all users, devices, contacts |
| GET | `/api/admin/devices` | Fetch all devices |
| GET | `/api/admin/contacts` | Fetch all contacts |
| POST | `/api/admin/create-user` | Create new user account |
| POST | `/api/admin/update-user-plan` | Change user's plan |
| POST | `/api/admin/manual-billing` | Manually override plan + optional Stripe charge |
| POST | `/api/admin/provision-number` | Buy Twilio phone number + register E911 address |
| POST | `/api/admin/toggle-device` | Toggle any device's online/offline status |
| POST | `/api/admin/delete-device` | Delete device + contacts |
| POST | `/api/admin/sip/cleanup` | Remove orphaned Twilio SIP credentials |
| POST | `/api/admin/twilio-check` | Verify Twilio configuration |
| GET/POST | `/api/admin/fix-sip-domains` | Bulk-update device SIP domain records in DB |

### VoIP (generic)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/voip/call-logs` | Fetch call logs for a device via VoIP provider |
| GET/POST | `/api/voip/contacts` | CRUD contacts via VoIP layer |
| GET/PUT/DELETE | `/api/voip/contacts/[id]` | Individual contact operations |
| GET/POST | `/api/voip/devices` | CRUD devices via VoIP layer |
| GET/PUT/DELETE | `/api/voip/devices/[id]` | Individual device operations |
| POST | `/api/voip/provision-device` | Provision device through VoIP layer |
| POST | `/api/voip/sip/setup-domain` | Setup SIP domain |
| POST | `/api/voip/update-provider` | Switch VoIP provider (Twilio/Telnyx) |

---

## Call Routing Logic

**Webhook:** `POST /api/twiml/route`  
Twilio calls this for every outgoing SIP call.

```
1. Parse To / From from Twilio form data
2. Look up device by SIP username (from From field)
3. Look up user → determine plan

── Path A: SIP-to-SIP (To is internal Ring Ring SIP address)
   → Always allowed (free tier)
   → Log call as sip_to_sip / completed
   → Return <Dial><Sip>...</Sip></Dial>

── Path B: PSTN (To is a phone number / non-internal SIP)
   ├─ Resolve quick-dial slot (1-9) → look up contact by deviceId + slot
   │   ├─ Contact has SIP address → route as SIP-to-SIP
   │   └─ Contact has phone number → use as PSTN destination
   ├─ Normalize number to E.164 (+1XXXXXXXXXX)
   ├─ Check whitelist (approved contacts for device/user)
   │   └─ Not whitelisted → <Say> blocked message + log as blocked
   ├─ Check plan (monthly or annual required for PSTN)
   │   └─ Free plan → <Say> upgrade required + log as blocked
   ├─ Check caller ID (user's twilioNumber)
   └─ Route: <Dial callerId="..."><Number>E.164</Number></Dial>
              log as pstn / completed
```

**Key behaviors:**
- E911/933 always routable (emergency services)
- Non-whitelisted numbers blocked with voice message
- Free plan: PSTN calls blocked
- All calls logged to `CallLog` table

---

## Device Provisioning

### Auto-Provisioning (`/api/provision/auto/[deviceId]`)

1. Detect device type from `User-Agent` header or `?type=grandstream|linksys` param
2. Ensure Twilio SIP domain is configured (`ensureTwilioSetup()`)
3. Look up device in DB; return 404 if not found
4. If no SIP credentials → generate `sip_{last6ofId}_{timestamp}` / random password → create in Twilio → save to DB
5. Fetch contacts ordered by `quickDialSlot`
6. Generate device-specific XML config
7. Log to `ProvisioningLog` (success or failure)
8. Update device: `lastProvisionedAt`, `provisioningStatus`, `configVersion`, `lastSeenIp`, `adapterType`
9. Return XML with `Content-Disposition: attachment`

### Grandstream HT801 Config (XML)
- P47/P48: SIP server domain + port 5060
- P35/P36/P34: SIP username + auth + password
- P3: Display name
- P52: NAT Keep-Alive
- P1411/P1412: STUN server (stun.l.google.com:19302)
- P1361: TCP transport
- P278: Dial plan `{ x+ }` (permissive — validation at webhook)
- P331: Outgoing prefix `+` (E.164 required by Twilio)
- P301–P309: Speed dial slots 1–9 (SIP URI or phone number)
- P194/P238: Disable auto-provisioning after config

### Linksys SPA2102 Config (XML)
- Proxy/Registrar/Outbound Proxy: `sip_domain:5060`
- Display name, user ID, password, auth ID
- NAT mapping + keep-alive (20s interval)
- STUN enabled (stun.l.google.com)
- TCP transport
- Codecs: G.711u, G.711a, G.729a
- RTP ports: 10000–20000
- Dial plan: whitelisted numbers + emergency (`911|933|...`)
- Dial plan prefix: `+`
- Speed Dial 1–9: `Name, number@domain`
- Provision disabled after first config

### MAC-Address Provisioning
`GET /api/provision/mac/[macAddress]` — looks up device by MAC address and returns appropriate config.

---

## Friend System

### Flow
```
Parent A: Create Invite → unique 64-char hex token (7-day expiry)
          → Share via QR / link / email / SMS

Parent B: Open /invite/[token]
          → Must be logged in (redirected to /login?redirect=... if not)
          → See sender's email
          → Select which of their own devices to share
          → Accept → POST /api/friends/invite/[token]/accept
             → Creates friendship record
             → Creates friend_device_permissions entries
             → Both parents can now add each other's devices as contacts
```

### Database Tables (Supabase)
- `friend_invites`: sender_user_id, invite_token, status (pending/accepted/expired), expires_at
- `friendships`: user_a_id, user_b_id, created_at
- `friend_device_permissions`: friendship_id, device_id (which devices each friend can see/call)

### Contact Type: `ring_ring_friend`
When a parent adds a Ring Ring Friend contact, the contact stores:
- `contact_type: 'ring_ring_friend'`
- `sip_username`: the friend device's SIP username
- `friend_device_id`: the friend device's DB ID
- `friendship_id`: the parent friendship record

At call time, the SIP username is dialed directly (SIP-to-SIP, free).

---

## Billing & Subscriptions

### Stripe Integration
- **Checkout:** `POST /api/stripe/checkout` creates/finds Stripe customer, creates subscription checkout session
- **Portal:** `POST /api/stripe/portal` redirects to Stripe Customer Portal (cancel, update payment)
- **Webhook:** `POST /api/stripe/webhook`
  - `checkout.session.completed` → set user plan to `'paid'`, save `stripeSubId`
  - `customer.subscription.deleted` → set user plan to `'free'`, clear `stripeSubId`

### Manual Billing (Admin)
`POST /api/admin/manual-billing` — directly updates user's plan in DB, optionally creates a Stripe charge. Used for Friends & Family, manual payments, exceptions.

### Plan Enforcement
- **Free:** PSTN calls blocked at TwiML webhook level; phone number contacts disabled in UI
- **Paid (monthly/annual):** PSTN calls allowed; Quiet Hours + Usage Cap unlocked in UI

### Buy Flow (`/buy`)
4-step wizard:
1. **Hardware** — Ring Ring Bridge ($39) or Starter Kit ($69)
2. **Plan** — Free, Monthly ($8.95), Annual ($85.80)
3. **Delivery** — Local pickup (Philadelphia) or shipping
4. **Checkout** — Email, password, name, area code (paid), shipping address (if shipping), E911 address (if paid)
   → `POST /api/buy/checkout`

---

## Database Schema (Summary)

### Prisma Models (PostgreSQL via Supabase)

**User**
- id, email, plan, twilioNumber, twilioNumberSid, stripeCustomerId, stripeSubId, areaCode
- e911Name, e911Street, e911City, e911State, e911Zip
- twoFactorEnabled, otp, otpExpiresAt

**Device**
- id, userId, name, status (online/offline)
- sipUsername, sipPassword, sipDomain
- macAddress, adapterType (`grandstream`|`linksys`|`other`), adapterIp
- quietHoursEnabled, quietHoursStart, quietHoursEnd
- usageCapEnabled, usageCapMinutes
- **phoneNumber** — linked phone line (backfilled from user's twilioNumber; set at device creation)
- lastProvisionedAt, provisioningStatus, configVersion, lastSeenIp

**Contact**
- id, userId, deviceId, name
- phoneNumber (PSTN), quickDialSlot (1–9 or null)
- contactType (`ring_ring_friend` | `phone_number`)
- sipUsername, sipAddress (for Ring Ring friends)
- friendDeviceId, friendshipId

**SipCredential**
- deviceId (unique), userId, twilioSid, sipUsername, sipPassword

**CallLog**
- userId, fromSip, toAddress, callType (`sip_to_sip`|`pstn`), status (`completed`|`blocked`)

**ProvisioningLog**
- deviceId, status (`success`|`failed`), configVersion, ipAddress, userAgent, errorMessage

### Supabase-Native Tables

- `friend_invites` — invite tokens, expiry, status
- `friendships` — bidirectional user connections
- `friend_device_permissions` — per-device visibility grants within a friendship

---

## Plans & Pricing

| Plan | Price | PSTN Calls | Quiet Hours | Kill Switch | Usage Cap | E911 |
|------|-------|------------|-------------|-------------|-----------|------|
| **Starter (Free)** | $0 | ✗ Ring Ring only | ✗ | ✓ | ✗ | ✗ |
| **Monthly** | $8.95/mo | ✓ Unlimited US | ✓ | ✓ | ✓ | ✓ |
| **Annual** | $85.80/yr (~$7.16/mo) | ✓ Unlimited US | ✓ | ✓ | ✓ | ✓ |

Annual saves ~20% ($21/year).

---

## Hardware

| Product | Price | Description |
|---------|-------|-------------|
| Ring Ring Bridge (adapter only) | $39 | BYOP — works with any analog phone |
| Starter Kit (adapter + phone) | $69 | Curated phone + adapter, ready to ring |

**Delivery options:**
- Local pickup — free, Philadelphia area, coordinated pickup
- Shipping — calculated at Stripe checkout

**Supported adapters:**
- Grandstream HT801 (ATA, 1 FXS port)
- Linksys SPA2102 (ATA, 2 FXS ports)

---

## Infrastructure & Integrations

| Service | Role |
|---------|------|
| **Next.js (App Router)** | Full-stack framework, all pages and API routes |
| **Supabase** | Auth (email/password), PostgreSQL database, RLS, real-time |
| **Prisma** | ORM for DB operations (used alongside Supabase direct queries) |
| **Twilio** | SIP domain (`ringringclub.sip.twilio.com`), phone number provisioning, TwiML call routing, E911 |
| **Stripe** | Subscription billing, checkout sessions, customer portal, webhooks |
| **Vercel** | Deployment, env vars, serverless functions |
| **Google STUN** | NAT traversal (`stun.l.google.com:19302`) |

### Key Environment Variables
- `TWILIO_SIP_DOMAIN` — `ringringclub.sip.twilio.com`
- `TWILIO_SIP_CRED_LIST_SID` — Twilio credential list SID
- `TWILIO_PHONE_NUMBER` — fallback caller ID
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`, `DIRECT_URL` — Supabase PostgreSQL connection strings
- `NEXT_PUBLIC_BASE_URL` — base URL for invite links
- `NEXT_PUBLIC_SITE_PASSWORD` — gate page password

### Production URL
`https://voip-dashboard-sigma.vercel.app`

### Cloudflare Worker (removed)
A provision proxy worker previously existed in `/workers/provision-proxy/` but was removed. Provisioning now goes directly to Vercel URLs.
