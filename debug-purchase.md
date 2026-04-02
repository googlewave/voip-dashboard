# Purchase Flow Debug Checklist

## Issue Report
- **Purchase:** Starter Kit + Monthly Plan
- **Problem 1:** No phone number provisioned
- **Problem 2:** Subscription not showing correctly in dashboard

## Debugging Steps

### 1. Check Stripe Webhook Configuration

**Go to:** [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)

**Verify:**
- [ ] Endpoint exists: `https://voip-dashboard-sigma.vercel.app/api/webhooks/stripe`
- [ ] Status: Enabled
- [ ] Events selected: `checkout.session.completed`, `customer.subscription.deleted`

**Check Recent Events:**
- [ ] Find your recent checkout event
- [ ] Click on it → Check "Response" tab
- [ ] Should show `200` status
- [ ] If 400/500, note the error message

### 2. Check Vercel Function Logs

**Go to:** Vercel Dashboard → Your Project → Deployments → Latest → Functions

**Look for `/api/webhooks/stripe` logs:**
- [ ] Do you see: `✅ User {id} upgraded to monthly`?
- [ ] Do you see: `📞 Phone number provisioned for user {id}: {number}`?
- [ ] Any error messages? (Copy them)

### 3. Check Your Database Record

**Go to:** Supabase Dashboard → Table Editor → users table

**Find your user record and check:**
- [ ] `plan` field = `monthly` or `annual` (not `free` or `pro`)
- [ ] `stripe_customer_id` = populated with `cus_...`
- [ ] `stripe_sub_id` = populated with `sub_...`
- [ ] `area_code` = your area code (e.g., `302`)
- [ ] `twilio_number` = phone number (e.g., `+13025551234`) or NULL?

### 4. Common Issues & Fixes

#### Issue A: Webhook Not Configured
**Symptom:** No webhook events in Stripe Dashboard
**Fix:** 
1. Add webhook endpoint in Stripe Dashboard
2. URL: `https://voip-dashboard-sigma.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`

#### Issue B: Webhook Returns 400 "Invalid signature"
**Symptom:** Stripe shows 400 error
**Fix:**
1. Get signing secret from Stripe webhook endpoint
2. Update in Vercel: `STRIPE_WEBHOOK_SECRET`
3. Redeploy

#### Issue C: Plan Shows as "pro" Instead of "monthly"
**Symptom:** Database shows `plan = 'pro'`
**Fix:** Old webhook code - already fixed in latest deployment
**Action:** Manually update your user record:
```sql
UPDATE users 
SET plan = 'monthly' 
WHERE email = 'your-email@example.com';
```

#### Issue D: Phone Number Not Provisioned
**Symptom:** `twilio_number` is NULL in database
**Possible Causes:**
1. Webhook didn't receive area code in metadata
2. E911 address missing from metadata
3. Twilio API error (no numbers available in area code)
4. Provision-number API failed

**Check Vercel Logs for:**
- `❌ Failed to provision phone number`
- Twilio error messages

**Manual Fix (Admin Portal):**
1. Login as admin
2. Go to Admin Portal → Users tab
3. Find your user
4. Click "+ Phone Number"
5. Enter area code + E911 address
6. Provision manually

### 5. Quick Fixes

#### Fix Dashboard Display Issue
**Already deployed** - dashboard now correctly reads `stripe_sub_id` field

#### Manually Provision Phone Number
If webhook failed, use admin portal:
1. Visit: `/admin`
2. Users tab → Find your account
3. Click "+ Phone Number" button
4. Fill in area code + E911 address
5. Click "Provision Number"

### 6. Test Checklist

After fixes, verify:
- [ ] Login to dashboard
- [ ] Subscription tab shows "Monthly Plan" or "Annual Plan"
- [ ] Phone number displays in blue box
- [ ] Settings tab shows Quiet Hours and Usage Cap options
- [ ] Plan badge shows in header

## Expected Database State

After successful purchase, your user record should have:

```
id: [uuid]
email: your-email@example.com
plan: monthly (or annual)
twilio_number: +13025551234
twilio_number_sid: PN...
stripe_customer_id: cus_...
stripe_sub_id: sub_...
area_code: 302
```

## Next Steps

1. **Check Stripe webhook events** - Did it fire? What was the response?
2. **Check Vercel logs** - Any errors during phone provisioning?
3. **Check database** - What does your user record show?
4. **Report findings** - Share what you found so we can fix the root cause

## Immediate Workaround

If you need a phone number right now:
1. Go to `/admin` (admin portal)
2. Users tab → Your account
3. Click "+ Phone Number"
4. Manually provision with area code + E911 address

This will get you unblocked while we debug the webhook issue.
