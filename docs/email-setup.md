# Email Notifications Setup Guide

## Overview

Ring Ring sends automated emails for:
- ✅ Order confirmation (immediately after checkout)
- 📞 Phone number provisioned (when number is ready)
- 🔔 Welcome email (with account details and phone number)

## Setup Resend (5 minutes)

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### 2. Add Your Domain (Recommended for Production)

**Option A: Use Your Domain (ringring.club)**

1. In Resend Dashboard → **Domains** → **Add Domain**
2. Enter: `ringring.club`
3. Add the DNS records to your domain provider:
   - **SPF Record** (TXT)
   - **DKIM Record** (TXT)
   - **DMARC Record** (TXT)
4. Wait for verification (usually 5-15 minutes)

**Option B: Use Resend's Test Domain (For Testing)**

Skip this step - you can send from `onboarding@resend.dev` for testing

### 3. Get API Key

1. Resend Dashboard → **API Keys**
2. Click **Create API Key**
3. Name: `Ring Ring Production`
4. Permission: **Sending access**
5. Copy the API key (starts with `re_eBF3C7Wg_CwcHZKWyUqqHtkJqqJstpPLL`)

### 4. Add to Vercel

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxx` (your API key)
   - **Environment:** Production (and Preview if needed)
3. Click **Save**

### 5. Update Email Sender (After Domain Verified)

Edit `/Users/bob/voip-dashboard/lib/email.ts`:

```typescript
// Change this line:
const FROM_EMAIL = 'Ring Ring <hello@ringring.club>';

// To use your verified domain:
const FROM_EMAIL = 'Ring Ring <hello@ringring.club>';
// Or for testing:
const FROM_EMAIL = 'Ring Ring <onboarding@resend.dev>';
```

## Email Templates

### Order Confirmation
**Sent:** Immediately after Stripe checkout completes
**Includes:**
- Order details (hardware, plan, delivery)
- Shipping address (if applicable)
- Next steps

### Phone Number Provisioned
**Sent:** When phone number is successfully provisioned
**Includes:**
- Phone number in large, easy-to-read format
- What the number can do
- Link to dashboard

### Welcome Email
**Sent:** After successful purchase with phone number
**Includes:**
- Welcome message
- Phone number (if provisioned)
- Getting started checklist
- Link to dashboard and setup guide

## Testing Emails

### Test Locally

1. Start dev server: `npm run dev`
2. Make sure `RESEND_API_KEY` is in `.env.local`
3. Trigger a test purchase or use admin portal to provision a number
4. Check your email inbox

### Test in Production

1. Complete a real test purchase with test card `4242 4242 4242 4242`
2. Check email inbox for:
   - Order confirmation
   - Welcome email (with phone number)

### View Email Logs

1. Resend Dashboard → **Emails**
2. See all sent emails with status
3. Click on any email to see:
   - Delivery status
   - Open/click tracking (if enabled)
   - Full email content

## Troubleshooting

### Emails Not Sending

**Check Vercel Logs:**
- Look for: `📧 Welcome email sent to...`
- Or errors: `Failed to send email:`

**Check Resend Dashboard:**
- Go to **Emails** tab
- Look for recent sends
- Check for errors

**Common Issues:**

1. **"Invalid API key"**
   - Verify `RESEND_API_KEY` is set in Vercel
   - Make sure it starts with `re_`
   - Regenerate key if needed

2. **"Domain not verified"**
   - Use `onboarding@resend.dev` for testing
   - Or complete domain verification in Resend

3. **Emails going to spam**
   - Complete domain verification (SPF, DKIM, DMARC)
   - Use your own domain instead of test domain
   - Add unsubscribe link (already included in templates)

## Email Triggers

### Automatic Triggers

| Event | Email Sent | Trigger |
|-------|-----------|---------|
| Checkout completed | Order Confirmation | Stripe webhook |
| Phone provisioned (webhook) | Welcome Email | After Twilio provisioning |
| Phone provisioned (admin) | Phone Provisioned | Admin portal action |

### Manual Testing

You can manually trigger emails by:
1. Using admin portal to provision a phone number
2. Completing a test purchase
3. Running the sync script (won't send emails)

## Customization

### Update Email Content

Edit `/Users/bob/voip-dashboard/lib/email.ts`:

- Change subject lines
- Update HTML templates
- Add/remove sections
- Customize branding

### Add New Email Types

1. Create new function in `lib/email.ts`
2. Import and call from appropriate API route
3. Test thoroughly

## Production Checklist

- [ ] Resend account created
- [ ] Domain verified (or using test domain)
- [ ] API key added to Vercel
- [ ] Test purchase completed successfully
- [ ] Order confirmation received
- [ ] Welcome email received
- [ ] Phone provisioned email received
- [ ] All emails look good on mobile and desktop

## Support

**Resend Documentation:** [resend.com/docs](https://resend.com/docs)
**Email Templates:** `/Users/bob/voip-dashboard/lib/email.ts`
**Webhook Handler:** `/Users/bob/voip-dashboard/app/api/webhooks/stripe/route.ts`
