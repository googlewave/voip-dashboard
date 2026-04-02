# Ring Ring — Deployment Status

> Last updated: April 2026 (session 14+)  
> Production: https://voip-dashboard-sigma.vercel.app  
> Deployed via: Vercel (auto-deploy on push to `main`)

---

## ✅ PRODUCTION READY — ALL CORE FEATURES COMPLETE

### Parent Portal (`/dashboard`)
- ✅ **Devices Tab** — add/delete devices, per-device inline settings (kill switch, quiet hours, usage cap), phone line shown per device, Setup Guide QR, Contacts quick-jump
- ✅ **Contacts Tab** — inline device picker (no dead-end), Safe Dial Dashboard (9 slots, drag-and-drop), Ring Ring Friend + PSTN contacts
- ✅ **Friends Tab** — invite creation with QR code, connected families list, pending invites
- ✅ **Phone Lines Tab** — free tier indicator, active lines from Stripe, E911 per-line (collapsible), two-step cancel, non-Stripe cancel path
- ✅ **Settings Tab** — email/password change, 2FA toggle
- ✅ **2FA** — email OTP via Resend, `/verify-2fa` page, SiteGuard enforcement

### Admin Portal (`/admin`)
- ✅ Users tab with provision number, manual billing, create user
- ✅ Add Device modal with phone line selector
- ✅ Device rows show linked phone number
- ✅ All Devices tab with SIP management, provisioning, edit/delete
- ✅ Billing tab, System tab with SIP cleanup

### Infrastructure
- ✅ Twilio SIP domain: `ringringclub.sip.twilio.com`
- ✅ Auto-provisioning: `/api/provision/auto/[deviceId]` (Grandstream + Linksys XML)
- ✅ Call routing webhook: `/api/twiml/route` (SIP-to-SIP free, PSTN gated by plan)
- ✅ Stripe subscriptions, webhooks, customer portal
- ✅ Supabase auth + PostgreSQL
- ✅ All DB migrations run on production

---

## 📋 DEPLOYMENT CHECKLIST (for new environments)

### 1. Environment Variables
Set all of the following in Vercel (or `.env.local` for local):
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
TWILIO_SIP_DOMAIN=ringringclub.sip.twilio.com
TWILIO_SIP_CRED_LIST_SID=CL...
STRIPE_SECRET_KEY
STRIPE_PRICE_ID_MONTHLY
STRIPE_PRICE_ID_ANNUAL
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

### 2. Database Migrations (run in order)
```bash
# Friend system tables
node scripts/run-migration.js prisma/migrations/add_friend_system.sql

# MAC address column
node scripts/run-migration.js prisma/migrations/add_mac_address.sql

# Provisioning tracking columns
node scripts/run-migration.js prisma/migrations/add_provisioning_tracking.sql

# E911 + 2FA fields on users
node scripts/run-migration.js prisma/migrations/add_e911_2fa.sql

# phone_number column on devices (+ backfill)
node -e "
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
c.connect().then(() =>
  c.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS phone_number TEXT')
).then(() =>
  c.query('UPDATE devices d SET phone_number = u.twilio_number FROM users u WHERE d.user_id = u.id AND u.twilio_number IS NOT NULL AND d.phone_number IS NULL')
).then(() => c.end());
"
```

### 3. Prisma Client
```bash
npx prisma generate
```

### 4. Deploy
```bash
git push origin main
# Vercel auto-deploys on push
```

### 5. Post-Deploy Checks
- [ ] Login works (`/gate` → `/login` → `/dashboard`)
- [ ] Devices tab loads, add device works
- [ ] Contacts tab: device picker shows, contacts save
- [ ] Phone Lines tab: active line shows, E911 toggle opens
- [ ] 2FA toggle in Settings → verify `/verify-2fa` flow
- [ ] Admin portal: add device with phone line selector
- [ ] Provisioning: QR code → Grandstream pulls config

---

## 🧪 KEY TEST FLOWS

### Phone Lines & E911
1. Login as paid user → Phone Lines tab
2. Verify active line shows with phone number
3. Click "🚨 E911 Emergency Address" → form expands
4. Save address → verify ✓ Saved confirmation
5. Collapse and reopen → address shows as summary

### Contacts Tab (no pre-selected device)
1. Click Contacts tab
2. Verify device picker cards appear (not an error message)
3. Click a device card → contacts load immediately

### Cancel Line (two-step)
1. Phone Lines tab → click Cancel
2. Verify confirmation panel appears
3. Click "Keep my line" → panel closes
4. Click Cancel again → confirm → verify cancellation

### 2FA
1. Settings tab → toggle 2FA on
2. Sign out → sign back in
3. Verify redirect to `/verify-2fa`
4. Enter OTP from email → verify redirect to dashboard

---

## 🚧 FUTURE WORK (not blocking launch)

| Item | Notes |
|------|-------|
| Multiple lines per user (DB) | Requires `lines` table; UI already prepared with per-device `phone_number` |
| Per-line E911 at DB level | Currently one E911 set per user; UI shows it per-line already |
| Call log UI | `CallLog` table populated; no parent-facing display yet |
| SMS invite sending | `POST /api/friends/invite/send-sms` not built |
| Admin: reassign device phone line | Currently set at creation only |

---

## 📚 KEY FILES

| File | Purpose |
|------|---------|
| `app/dashboard/page.tsx` | Parent Portal — all tabs |
| `app/admin/AdminDashboard.tsx` | Admin Portal |
| `app/verify-2fa/page.tsx` | 2FA verification page |
| `app/dashboard/FriendsTab.tsx` | Friends tab component |
| `prisma/schema.prisma` | Full data model |
| `lib/email.ts` | Resend email functions (OTP, invites, welcome) |
| `app/api/twiml/route.ts` | Twilio call routing webhook |
| `app/api/provision/auto/[deviceId]/route.ts` | Auto-provisioning (Grandstream + Linksys) |
| `app/api/billing/` | Subscriptions, cancel-subscription, cancel-number |
| `app/api/auth/` | send-otp, verify-otp |
| `components/SiteGuard.tsx` | Auth + 2FA enforcement on all protected pages |
