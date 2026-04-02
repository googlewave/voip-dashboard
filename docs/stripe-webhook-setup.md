# Stripe Webhook Setup Guide

## Overview

This guide walks you through setting up Stripe webhooks to automatically provision phone numbers after a successful checkout.

## What the Webhook Does

When a customer completes checkout for a paid plan (Monthly or Annual), the webhook will:
1. Receive the `checkout.session.completed` event from Stripe
2. Extract the user's area code and E911 address from metadata
3. Call the Twilio API to provision a phone number
4. Register the E911 address with Twilio
5. Update the user's database record with the new phone number

## Step 1: Create the Webhook Endpoint in Stripe Dashboard

### Local Testing (Development)

1. **Install Stripe CLI** (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** that appears (starts with `whsec_...`)

5. **Add to `.env.local`**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

### Production Setup

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)

2. **Click "Add endpoint"**

3. **Enter your endpoint URL**:
   ```
   https://voip-dashboard-sigma.vercel.app/api/webhooks/stripe
   ```

4. **Select events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.updated` (optional, for plan changes)
   - `customer.subscription.deleted` (optional, for cancellations)

5. **Click "Add endpoint"**

6. **Copy the Signing Secret** (starts with `whsec_...`)

7. **Add to Vercel Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxxxxxxxxxx`
   - Make sure it's available for Production

## Step 2: Test the Webhook

### Using Stripe CLI (Local)

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **In another terminal, forward webhooks**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Trigger a test event**:
   ```bash
   stripe trigger checkout.session.completed
   ```

4. **Check your terminal** for webhook processing logs

### Using Stripe Dashboard (Production)

1. Go to Stripe Dashboard → Webhooks → Your endpoint

2. Click "Send test webhook"

3. Select `checkout.session.completed`

4. Click "Send test webhook"

5. Check the response - should be `200 OK`

## Step 3: Test End-to-End Flow

### Complete Purchase Flow Test

1. **Go to** `https://voip-dashboard-sigma.vercel.app/buy`

2. **Select**:
   - Hardware: Adapter or Starter Kit
   - Plan: Monthly or Annual (not Free)
   - Delivery: Pickup or Shipping

3. **Fill out checkout form**:
   - Email: Use a test email (e.g., `test+webhook@example.com`)
   - Password: Any password
   - Name: Test User
   - **Area Code**: 302 (or any valid US area code)
   - E911 Address: Use a real address

4. **Use Stripe test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. **Complete checkout**

6. **Verify**:
   - Check webhook logs in Stripe Dashboard
   - Check Vercel logs for phone provisioning
   - Login to dashboard and check Subscription tab for phone number

## Step 4: Monitor and Debug

### Check Webhook Logs in Stripe

1. Go to Stripe Dashboard → Webhooks → Your endpoint
2. Click on recent events
3. Check "Response" tab for errors
4. Look for `200` status code (success) or error messages

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Go to "Functions" tab
4. Look for `/api/webhooks/stripe` logs

### Common Issues

**Webhook returns 400 "Invalid signature"**
- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly in Vercel
- Verify you're using the signing secret from the correct endpoint (test vs production)

**Phone number not provisioning**
- Check Vercel logs for Twilio API errors
- Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
- Check that area code is valid and has available numbers
- Verify E911 address is complete and valid

**User created but no phone number**
- Webhook might be failing silently
- Check Stripe webhook logs for errors
- Verify `/api/admin/provision-number` endpoint is working

## Step 5: Webhook Security Best Practices

✅ **Always verify webhook signatures** (already implemented in the code)
✅ **Use HTTPS in production** (Vercel handles this)
✅ **Keep webhook secret secure** (stored in environment variables)
✅ **Handle idempotency** (Stripe may send same event multiple times)
✅ **Return 200 quickly** (process async if needed)

## Environment Variables Checklist

Make sure these are set in **both** `.env.local` (local) and Vercel (production):

- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`
- ✅ `TWILIO_ACCOUNT_SID`
- ✅ `TWILIO_AUTH_TOKEN`
- ✅ `TWILIO_SIP_DOMAIN`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## Troubleshooting Commands

**Check if webhook is receiving events**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe --print-json
```

**Manually trigger specific event**:
```bash
stripe trigger checkout.session.completed
```

**View recent webhook events**:
```bash
stripe events list --limit 10
```

**Resend a failed webhook**:
Go to Stripe Dashboard → Webhooks → Click on event → "Resend event"

## Next Steps After Setup

1. ✅ Test with real checkout flow
2. ✅ Verify phone number appears in user dashboard
3. ✅ Test SIP provisioning with the new number
4. ✅ Set up monitoring/alerts for webhook failures
5. ✅ Document the flow for your team

## Support

If you encounter issues:
- Check Stripe Dashboard webhook logs
- Check Vercel function logs
- Review Twilio API logs
- Test the `/api/admin/provision-number` endpoint directly in admin portal
