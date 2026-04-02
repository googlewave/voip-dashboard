# Vercel Environment Variables Setup

Run these commands to add your Stripe environment variables to Vercel:

```bash
# Navigate to project directory
cd /Users/bob/voip-dashboard

# Add Stripe keys (replace with your actual keys from .env.local)
vercel env add STRIPE_SECRET_KEY production
# Paste: sk_test_... (from your .env.local)

vercel env add STRIPE_PUBLISHABLE_KEY production
# Paste: pk_test_... (from your .env.local)

# Add Stripe Product IDs
vercel env add STRIPE_ADAPTER_PRODUCT_ID production
# Paste: prod_UCMsqUpqWdvpbM

vercel env add STRIPE_ADAPTER_PRICE_ID production
# Paste: price_1TDy9BLza8h22DgjZfShvNJN

vercel env add STRIPE_STARTER_KIT_PRODUCT_ID production
# Paste: prod_UCMujQGmtzCyqG

vercel env add STRIPE_STARTER_KIT_PRICE_ID production
# Paste: price_1TDyAfLza8h22DgjKwRp8U3S

vercel env add STRIPE_PAID_PLAN_PRODUCT_ID production
# Paste: prod_UCMrL8r0F1vSYd

vercel env add STRIPE_PAID_PLAN_MONTHLY_PRICE_ID production
# Paste: price_1TDy7PLza8h22DgjU9KS1TAA

vercel env add STRIPE_PAID_PLAN_ANNUAL_PRICE_ID production
# Paste: price_1TDy7PLza8h22DgjDaGmw1gE

# Add base URL for redirect URLs
vercel env add NEXT_PUBLIC_BASE_URL production
# Paste: https://voip-dashboard-sigma.vercel.app
```

## Alternative: Use Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable one by one with the values above
6. Make sure to select **Production** environment

## After Adding Variables

Redeploy with:
```bash
npx vercel --prod
```

Or wait for automatic deployment (happens when you save env vars in dashboard).

## Test the Checkout

Once deployed, visit:
https://voip-dashboard-sigma.vercel.app/buy

And complete the 4-step flow to test Stripe checkout.
