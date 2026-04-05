# Stripe Setup Guide for Ring Ring
*Step-by-step instructions to create products and prices for hardware and subscriptions.*

---

## 1. Before You Start

- Log in to your Stripe Dashboard at https://dashboard.stripe.com
- Ensure you're in **Test Mode** (toggle in top-left) until you're ready to go live
- Have your brand-principles.md and website-style-guide.md handy for exact pricing/names

---

## 2. Create Subscription Products

### 2.1 Starter Plan (Free)

**Skip creating a Stripe product for the free plan.** We'll handle this entirely in the app logic. No Stripe subscription needed.

### 2.2 Make It Ring Ring Plan (Paid)

1. In Stripe Dashboard → **Products** → **Add product**
2. **Product details:**
   - **Name:** `Make It Ring Ring Plan`
   - **Description:** `Unlimited inbound/outbound calls to any US number. Real E911 with verified address.`
   - **Image:** (optional) upload a simple icon or leave blank
   - **Metadata (optional but recommended):**
     - `plan_type`: `paid`
     - `includes`: `unlimited_us_calls,unlimited_contacts,quiet_hours,kill_switch,usage_caps,e911`

3. **Pricing:**
   - **Price 1 — Monthly:**
     - **Amount:** `8.95` USD
     - **Currency:** USD
     - **Billing period:** `Recurring` → `Monthly`
     - **Nickname:** `Monthly`
    - **Price 2 — Annual (10% off):**
     - Click **Add another price**
       - **Amount:** `96.66` USD (8.95 × 12 × 0.9 = 96.66)
     - **Currency:** USD
     - **Billing period:** `Recurring` → `Yearly` (every 12 months)
       - **Nickname:** `Annual (10% off)`

4. Click **Save product**

5. **Copy the IDs:**
   - Product ID: starts with `prod_`
   - Monthly Price ID: starts with `price_`
   - Annual Price ID: starts with `price_`

---

## 3. Create Hardware Products

### 3.1 Ring Ring Bridge (Adapter Only)

1. **Products** → **Add product**
2. **Product details:**
   - **Name:** `Ring Ring Bridge`
   - **Description:** `The small adapter that connects any analog phone to our network. Pre-configured. Just plug it in.`
   - **Image:** (optional) photo of the adapter
   - **Metadata:**
     - `type`: `hardware`
     - `category`: `adapter`

3. **Pricing:**
   - **Amount:** `39.00` USD
   - **Currency:** USD
   - **Billing period:** `One-time`
   - **Nickname:** `Adapter Only`

4. **Save** and copy IDs

### 3.2 Starter Kit (Adapter + Phone)

1. **Products** → **Add product**
2. **Product details:**
   - **Name:** `Ring Ring Starter Kit`
   - **Description:** `Ring Ring Bridge + a curated analog phone. Ready to ring out of the box.`
   - **Image:** (optional) photo of the kit
   - **Metadata:**
     - `type`: `hardware`
     - `category`: `starter_kit`

3. **Pricing:**
   - **Amount:** `69.00` USD
   - **Currency:** USD
   - **Billing period:** `One-time`
   - **Nickname:** `Starter Kit`

4. **Save** and copy IDs

---

## 4. Add IDs to Environment

Add these to your `.env.local` and Vercel environment variables:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... (your test secret key)
STRIPE_PUBLISHABLE_KEY=pk_test_... (your test publishable key)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook setup later)

# Stripe Products
STRIPE_ADAPTER_PRODUCT_ID=prod_...
STRIPE_ADAPTER_PRICE_ID=price_...
STRIPE_STARTER_KIT_PRODUCT_ID=prod_...
STRIPE_STARTER_KIT_PRICE_ID=price_...

# Stripe Subscriptions
STRIPE_PAID_PLAN_PRODUCT_ID=prod_...
STRIPE_PAID_PLAN_MONTHLY_PRICE_ID=price_...
STRIPE_PAID_PLAN_ANNUAL_PRICE_ID=price_...
```

---

## 5. Test Checkout Flow (Optional)

You can test your products immediately:

1. In Stripe Dashboard → **Checkout** → **Create session**
2. Select one of your products
3. Set **Success URL** to `http://localhost:3000/billing?success=true`
4. Set **Cancel URL** to `http://localhost:3000/billing?canceled=true`
5. Click **Create checkout session** → copy the URL
6. Paste URL in browser to test the checkout experience

---

## 6. Webhook Setup (For Later)

When you're ready to handle subscription events:

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://voip-dashboard-sigma.vercel.app/api/stripe/webhook`
3. **Events to send:** Select these events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Click **Add endpoint**
5. Copy the **Signing secret** → add to `STRIPE_WEBHOOK_SECRET` in env

---

## 7. Going Live

When ready to launch:

1. Toggle from **Test Mode** to **Live Mode** in Stripe Dashboard
2. Repeat steps 2–4 to create live products (or use "Copy to live mode" if available)
3. Update environment variables with live keys and IDs
4. Test the live checkout with real payment methods

---

## 8. Reference IDs Summary

Save these somewhere safe:

| Item | Test ID | Live ID (later) |
|---|---|---|
| Adapter Product | `prod_test_...` | `prod_live_...` |
| Adapter Price | `price_test_...` | `price_live_...` |
| Starter Kit Product | `prod_test_...` | `prod_live_...` |
| Starter Kit Price | `price_test_...` | `price_live_...` |
| Paid Plan Product | `prod_test_...` | `prod_live_...` |
| Paid Plan Monthly | `price_test_...` | `price_live_...` |
| Paid Plan Annual | `price_test_...` | `price_live_...` |
| Secret Key | `sk_test_...` | `sk_live_...` |
| Publishable Key | `pk_test_...` | `pk_live_...` |
| Webhook Secret | `whsec_test_...` | `whsec_live_...` |

---

## 9. Next Steps

Once you have these IDs, I can:
- Wire them into the `/buy` purchase flow
- Update the billing page to use the correct subscription prices
- Add hardware options to the checkout
- Handle Stripe webhooks for subscription management

Let me know when you've created the products and I'll integrate them.
