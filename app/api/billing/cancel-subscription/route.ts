import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscriptionId } = await req.json() as { subscriptionId: string };
  if (!subscriptionId) return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.stripeCustomerId) return NextResponse.json({ error: 'No billing account' }, { status: 400 });

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  if (sub.customer !== dbUser.stripeCustomerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const updated = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({ success: true, cancelAtPeriodEnd: updated.cancel_at_period_end });
}
