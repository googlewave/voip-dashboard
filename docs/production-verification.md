# Production Webhook Verification

## ✅ Completed Steps

1. **Webhook Secret Added to Vercel** ✓
   - Environment variable: `STRIPE_WEBHOOK_SECRET`
   - Status: Added by user

## 🔍 Verification Steps

### Step 1: Confirm Stripe Webhook Endpoint

Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)

**Check that you have an endpoint configured:**
- URL: `https://voip-dashboard-sigma.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Status: Should show "Enabled"

**If not configured yet:**
1. Click "Add endpoint"
2. Enter URL: `https://voip-dashboard-sigma.vercel.app/api/webhooks/stripe`
3. Select events:
   - ✓ `checkout.session.completed`
   - ✓ `customer.subscription.deleted`
4. Click "Add endpoint"
5. Copy the signing secret (you already added this to Vercel ✓)

### Step 2: Test the Webhook

**Option A: Send Test Webhook from Stripe Dashboard**

1. Go to your webhook endpoint in Stripe Dashboard
2. Click "Send test webhook"
3. Select event type: `checkout.session.completed`
4. Click "Send test webhook"
5. Check response - should see `200 OK`

**Option B: Trigger Real Test Event**

Using Stripe CLI:
```bash
stripe trigger checkout.session.completed --stripe-version 2026-02-25
```

### Step 3: Monitor Webhook Delivery

**In Stripe Dashboard:**
1. Go to Webhooks → Your endpoint
2. Click on "Events" tab
3. Look for recent events
4. Check "Response" - should be `200`
5. Check "Logs" for any errors

**In Vercel:**
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Latest deployment
3. Click "Functions" tab
4. Look for `/api/webhooks/stripe` logs
5. Should see: `✅ User {id} upgraded to {plan}`

### Step 4: End-to-End Test

**Complete a test purchase:**

1. Visit: `https://voip-dashboard-sigma.vercel.app/buy`

2. Select:
   - Hardware: Adapter ($39)
   - Plan: Monthly ($8.95/mo)
   - Delivery: Pickup (free)

3. Fill out form:
   - Email: `test+webhook@yourdomain.com`
   - Password: Any password
   - Name: Test User
   - **Area Code: 302** (or your preferred area code)
   - **E911 Address:** Use a real address

4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/28)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 19801)

5. Complete checkout

6. **Verify:**
   - ✓ Redirected to welcome page
   - ✓ Check Stripe webhook logs (should see event delivered)
   - ✓ Check Vercel logs (should see phone provisioning)
   - ✓ Login to dashboard → Subscription tab
   - ✓ **Phone number should be displayed!** 📞

## 🎯 Expected Results

### Successful Webhook Processing

**Stripe Dashboard:**
```
Event: checkout.session.completed
Status: 200 OK
Response: {"received":true}
```

**Vercel Logs:**
```
✅ User abc-123-def upgraded to monthly
📞 Phone number provisioned for user abc-123-def: +13025551234
```

**User Dashboard:**
```
📞 Your Ring Ring Number
+1 (302) 555-1234
This is your dedicated phone number for making and receiving calls.
```

## 🐛 Troubleshooting

### Webhook Returns 400 "Invalid signature"
**Cause:** Wrong webhook secret
**Fix:** 
1. Get correct secret from Stripe Dashboard → Webhooks → Your endpoint
2. Update in Vercel: Settings → Environment Variables → `STRIPE_WEBHOOK_SECRET`
3. Redeploy (or wait for auto-deploy)

### Webhook Returns 200 but No Phone Number
**Check Vercel Logs:**
- Look for Twilio API errors
- Verify area code is valid
- Check E911 address is complete

**Common Issues:**
- Area code has no available numbers → Try different area code
- Twilio credentials missing → Check `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- E911 address invalid → Must be real, complete address

### Phone Number Not Showing in Dashboard
**Verify:**
1. User plan updated to monthly/annual (check Supabase)
2. `twilio_number` field populated in users table
3. User is logged in and viewing correct account
4. Hard refresh dashboard (Cmd+Shift+R)

## ✅ Production Checklist

- [x] Webhook secret added to Vercel
- [ ] Webhook endpoint configured in Stripe Dashboard
- [ ] Test webhook sent successfully (200 response)
- [ ] End-to-end purchase test completed
- [ ] Phone number provisioned automatically
- [ ] Number displays in user dashboard
- [ ] E911 address registered with Twilio

## 📊 Monitoring

**Ongoing monitoring:**
- Check Stripe webhook delivery success rate
- Monitor Vercel function logs for errors
- Track Twilio provisioning success
- Review failed webhook events weekly

**Set up alerts for:**
- Webhook delivery failures
- Twilio API errors
- Phone provisioning failures

## 🎉 Success Criteria

You'll know it's working when:
1. ✓ Stripe shows 200 responses for webhook events
2. ✓ Vercel logs show successful phone provisioning
3. ✓ Users see their phone number in the dashboard immediately after purchase
4. ✓ No manual intervention needed for phone number setup

---

**Status: Ready for Production Testing**

Next step: Send a test webhook from Stripe Dashboard or complete a test purchase!
