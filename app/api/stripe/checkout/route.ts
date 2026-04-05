import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const stripe = getStripe();

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  let customerId = dbUser?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.upsert({
      where: { id: user.id },
      update: { stripeCustomerId: customerId },
      create: { id: user.id, email: user.email!, stripeCustomerId: customerId },
    });
  }

  const body = await req.json().catch(() => ({}));
  const selectedPlan = body?.plan === 'annual' ? 'annual' : 'monthly';
  const selectedPriceId = selectedPlan === 'annual'
    ? process.env.STRIPE_PAID_PLAN_ANNUAL_PRICE_ID || process.env.STRIPE_PRICE_ID_ANNUAL
    : process.env.STRIPE_PAID_PLAN_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID;

  if (!selectedPriceId) {
    return NextResponse.json({ error: 'Missing Stripe price configuration' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/';
  const normalizedAppUrl = appUrl.endsWith('/') ? appUrl : `${appUrl}/`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: selectedPriceId, quantity: 1 }],
    success_url: `${normalizedAppUrl}billing?success=true`,
    cancel_url: `${normalizedAppUrl}billing?canceled=true`,
    metadata: { userId: user.id, plan: selectedPlan, source: 'billing-page' },
  });

  return NextResponse.json({ url: session.url });
}
