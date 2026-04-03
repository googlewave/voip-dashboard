import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Server-side Supabase client with service role for user creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: NextRequest) {
  try {
    const {
      hardware,
      plan,
      delivery,
      email,
      password,
      name,
      areaCode,
      shippingAddress,
      e911Address,
      couponCode,
    } = await req.json();

    // 1. Create Supabase user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create account' }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Create user record in database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: email,
        plan: 'free', // Will be updated by webhook after payment
        area_code: areaCode || null,
      });

    if (dbError) {
      console.error('Failed to create user record:', dbError);
      // Don't fail the checkout, webhook will handle it
    }

    // 3. Build Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Hardware
    if (hardware === 'adapter') {
      lineItems.push({
        price: process.env.STRIPE_ADAPTER_PRICE_ID!,
        quantity: 1,
      });
    } else if (hardware === 'kit') {
      lineItems.push({
        price: process.env.STRIPE_STARTER_KIT_PRICE_ID!,
        quantity: 1,
      });
    }

    // Subscription plan
    if (plan === 'monthly') {
      lineItems.push({
        price: process.env.STRIPE_PAID_PLAN_MONTHLY_PRICE_ID!,
        quantity: 1,
      });
    } else if (plan === 'annual') {
      lineItems.push({
        price: process.env.STRIPE_PAID_PLAN_ANNUAL_PRICE_ID!,
        quantity: 1,
      });
    }

    // 3b. Resolve coupon → Stripe promotion code ID
    let stripePromoCodeId: string | undefined;
    if (couponCode && plan !== 'free') {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });

      // Validate coupon is still usable
      const couponValid =
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (coupon.maxRedemptions === null || coupon.timesRedeemed < coupon.maxRedemptions) &&
        (coupon.appliesTo === 'both' || coupon.appliesTo === plan);

      if (couponValid && coupon.stripePromoCodeId) {
        stripePromoCodeId = coupon.stripePromoCodeId;
      }
    }

    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: plan === 'free' ? 'payment' : 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/buy?canceled=true`,
      customer_email: email,
      discounts: stripePromoCodeId ? [{ promotion_code: stripePromoCodeId }] : undefined,
      metadata: {
        userId,
        hardware,
        plan,
        delivery,
        name,
        areaCode: areaCode || '',
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : '',
        e911Address: e911Address ? JSON.stringify(e911Address) : '',
        couponCode: couponCode || '',
      },
      shipping_address_collection: delivery === 'shipping' ? {
        allowed_countries: ['US'],
      } : undefined,
    });

    // Increment coupon redemption count after session is created successfully
    if (couponCode && stripePromoCodeId) {
      await prisma.coupon.update({
        where: { code: couponCode.toUpperCase() },
        data: { timesRedeemed: { increment: 1 } },
      }).catch(() => {
        // Non-critical — don't fail checkout if this update fails
      });
    }

    // Send order confirmation email for free plan (paid plans handled by webhook)
    if (plan === 'free') {
      try {
        await sendOrderConfirmationEmail({
          to: email,
          name: name,
          hardware: hardware,
          plan: plan,
          delivery: delivery,
          shippingAddress: delivery === 'shipping' ? shippingAddress : undefined,
        });
      } catch (emailErr: any) {
        console.error('Failed to send order confirmation email:', emailErr.message);
      }
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
