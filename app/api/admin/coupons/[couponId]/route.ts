import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

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

// DELETE /api/admin/coupons/[couponId] — deactivate a coupon
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ couponId: string }> }
) {
  const stripe = getStripe();

  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { couponId } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });

  // Deactivate Stripe promotion code so it can't be used at Stripe level
  if (coupon.stripePromoCodeId) {
    await stripe.promotionCodes.update(coupon.stripePromoCodeId, { active: false });
  }

  // Mark inactive in our DB
  await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
