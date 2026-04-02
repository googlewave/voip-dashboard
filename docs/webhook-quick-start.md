# Webhook Quick Start

## 🚀 Fast Setup (5 minutes)

### 1. Get Your Webhook Secret

**For Local Development:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the `whsec_...` secret that appears.

**For Production:**
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://voip-dashboard-sigma.vercel.app/api/webhooks/stripe`
4. Events: Select `checkout.session.completed` and `customer.subscription.deleted`
5. Copy the signing secret

### 2. Add Environment Variable

**Local (`.env.local`):**
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Production (Vercel):**
1. Vercel Dashboard → Settings → Environment Variables
2. Add: `STRIPE_WEBHOOK_SECRET` = `whsec_xxxxxxxxxxxxx`
3. Redeploy

### 3. Test It

**Quick Test:**
```bash
stripe trigger checkout.session.completed
```

**Full Test:**
1. Go to `/buy`
2. Select Monthly plan + Adapter
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check dashboard → Subscription tab for phone number

## ✅ What Happens Automatically

When a customer completes checkout:
1. ✅ User account created in Supabase
2. ✅ Plan updated to monthly/annual
3. ✅ Stripe customer ID saved
4. ✅ **Phone number provisioned** (if area code provided)
5. ✅ **E911 address registered** with Twilio
6. ✅ Number appears in user dashboard

## 🔍 Verify It's Working

**Check Stripe Dashboard:**
- Webhooks → Your endpoint → Recent events
- Should see `200` responses

**Check Vercel Logs:**
- Look for: `📞 Phone number provisioned for user...`

**Check User Dashboard:**
- Login → Subscription tab
- Should see phone number displayed

## 🐛 Troubleshooting

**"Invalid signature" error:**
- Wrong webhook secret → Check `.env.local` or Vercel env vars

**Phone number not provisioning:**
- Check Vercel logs for Twilio errors
- Verify area code is valid (e.g., 302, 215, 610)
- Ensure E911 address is complete

**Webhook not receiving events:**
- For local: Make sure `stripe listen` is running
- For production: Check endpoint URL in Stripe dashboard

## 📝 Environment Variables Needed

Make sure these are set in Vercel:
- `STRIPE_SECRET_KEY` ✓
- `STRIPE_WEBHOOK_SECRET` ← **Add this one**
- `TWILIO_ACCOUNT_SID` ✓
- `TWILIO_AUTH_TOKEN` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓

## 🎯 Next Steps

1. Set up webhook in Stripe (5 min)
2. Add webhook secret to Vercel (2 min)
3. Redeploy (automatic)
4. Test with real checkout (5 min)
5. Done! 🎉
