# Dashboard Deployment Guide

## Database Migration Required

Before deploying the new dashboard, you need to run the SQL migration to add the new columns.

### Run in Supabase SQL Editor:

1. Go to your Supabase project → **SQL Editor**
2. Create a new query
3. Paste and run this SQL:

```sql
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
```

## New Dashboard Features

### Routes
- `/` → Redirects to `/dashboard`
- `/dashboard` → New enterprise-grade customer dashboard

### Features Implemented

#### 1. **Devices Tab**
- Add/delete devices
- Digital kill switch (online/offline toggle)
- Device status indicators
- Quick access to manage contacts

#### 2. **Contacts Tab**
- Device selector
- Quick dial grid (1-9 shortcuts)
- Add/remove contacts
- Assign contacts to quick dial slots
- Visual quick dial layout

#### 3. **Settings Tab**
- **Digital Kill Switch** — Turn device on/off instantly
- **Quiet Hours** (paid plans only) — Schedule silence during homework, dinner, bedtime
- **Usage Caps** (paid plans only) — Set daily talk time limits
- Upgrade prompts for free users

#### 4. **Subscription Tab**
- Current plan display
- Feature list
- Manage subscription button (Stripe portal)
- Upgrade CTA for free users

### Design System
- Matches brand style guide (`#FAF7F2` background, `#C4531A` primary)
- Modern nostalgia aesthetic
- Rounded corners (`rounded-3xl`, `rounded-xl`)
- Clean, spacious layout
- Consistent typography (font-black for headings)

### Access Control
- Free plan: Basic features (devices, contacts, kill switch)
- Paid plans: Advanced features (quiet hours, usage caps)
- Upgrade prompts shown contextually

## Testing Checklist

After deployment:

1. **Login** → Should redirect to `/dashboard`
2. **Devices Tab**
   - Add a device
   - Toggle device on/off (kill switch)
   - Delete a device
3. **Contacts Tab**
   - Select a device
   - Add contacts
   - Assign quick dial slots
   - Remove contacts
4. **Settings Tab**
   - Toggle kill switch
   - (If paid) Configure quiet hours
   - (If paid) Set usage cap
5. **Subscription Tab**
   - View current plan
   - Click "Manage Subscription" (should open Stripe portal)
   - (If free) Click upgrade CTA

## Known Limitations

- Email notifications not yet implemented
- E911 address management not yet in dashboard (collected during checkout)
- Call history/usage stats not yet implemented
- Multi-device management could be enhanced with bulk actions

## Future Enhancements

- Call logs and usage analytics
- E911 address editing
- Device provisioning status
- SIP credential management UI
- Bulk contact import
- Contact groups/categories
