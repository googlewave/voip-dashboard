import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/admin/coupons/validate — validate a coupon code before checkout
// Public endpoint — no auth required (user is not logged in yet at buy page)
export async function POST(req: NextRequest) {
  const { code, plan } = await req.json();

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 404 });
  }

  // Check expiry
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 410 });
  }

  // Check max redemptions
  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return NextResponse.json({ error: 'This coupon has reached its redemption limit' }, { status: 410 });
  }

  // Check plan eligibility (only validate if a plan is provided)
  if (plan && plan !== 'free') {
    if (coupon.appliesTo !== 'both' && coupon.appliesTo !== plan) {
      const planLabel = coupon.appliesTo === 'monthly' ? 'monthly plan' : 'annual plan';
      return NextResponse.json({ error: `This coupon only applies to the ${planLabel}` }, { status: 422 });
    }
  }

  // Return sanitized coupon info (no internal IDs)
  return NextResponse.json({
    valid: true,
    code: coupon.code,
    percentOff: coupon.percentOff,
    duration: coupon.duration,
    durationInMonths: coupon.durationInMonths,
    appliesTo: coupon.appliesTo,
    description: coupon.description,
  });
}
