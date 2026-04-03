import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/admin/coupons — list all coupons
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ coupons });
}

// POST /api/admin/coupons — create a new coupon
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    code,
    description,
    percentOff,
    duration,
    durationInMonths,
    appliesTo,
    maxRedemptions,
    expiresAt,
  } = await req.json();

  // Validate input
  if (!code || !percentOff || !duration) {
    return NextResponse.json({ error: 'code, percentOff, and duration are required' }, { status: 400 });
  }
  if (percentOff <= 0 || percentOff > 100) {
    return NextResponse.json({ error: 'percentOff must be between 1 and 100' }, { status: 400 });
  }
  if (duration === 'repeating' && (!durationInMonths || durationInMonths < 1)) {
    return NextResponse.json({ error: 'durationInMonths is required for repeating coupons' }, { status: 400 });
  }

  // Check for duplicate code in our DB
  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 });
  }

  // Create Stripe coupon
  const stripeCoupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: duration as 'once' | 'repeating' | 'forever',
    duration_in_months: duration === 'repeating' ? durationInMonths : undefined,
    max_redemptions: maxRedemptions || undefined,
    redeem_by: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
    name: `${code.toUpperCase()} — ${description || `${percentOff}% off`}`,
    metadata: { appliesTo: appliesTo || 'both' },
  });

  // Create Stripe promotion code (the human-readable code layer)
  const stripePromoCode = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: stripeCoupon.id },
    code: code.toUpperCase(),
    max_redemptions: maxRedemptions || undefined,
    expires_at: expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined,
  });

  // Save to our DB
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description: description || null,
      percentOff,
      duration,
      durationInMonths: duration === 'repeating' ? durationInMonths : null,
      appliesTo: appliesTo || 'both',
      maxRedemptions: maxRedemptions || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      stripeCouponId: stripeCoupon.id,
      stripePromoCodeId: stripePromoCode.id,
    },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
