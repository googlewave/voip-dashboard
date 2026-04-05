import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const stripe = getStripe();

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
