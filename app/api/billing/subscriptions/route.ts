import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.stripeCustomerId) return NextResponse.json({ subscriptions: [] });

  const subs = await stripe.subscriptions.list({
    customer: dbUser.stripeCustomerId,
    limit: 10,
    expand: ['data.items.data.price'],
  });

  return NextResponse.json({
    subscriptions: subs.data.map((sub) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = sub as any;
      const price = sub.items.data[0]?.price as Stripe.Price | undefined;
      return {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: s.current_period_end ?? s.billing_cycle_anchor ?? 0,
        cancelAtPeriodEnd: s.cancel_at_period_end ?? false,
        amount: price?.unit_amount ?? 0,
        currency: sub.currency,
        interval: price?.recurring?.interval ?? 'month',
      };
    }),
  });
}
