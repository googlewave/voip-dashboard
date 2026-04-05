import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { getMobileRequestUser } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const authUser = await getMobileRequestUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      plan: true,
      stripeCustomerId: true,
      twilioNumber: true,
    },
  });

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json({
      plan: dbUser?.plan ?? 'free',
      phoneNumber: dbUser?.twilioNumber ?? null,
      subscriptions: [],
      invoices: [],
    });
  }

  const stripe = getStripe();

  const [subscriptions, invoices] = await Promise.all([
    stripe.subscriptions.list({
      customer: dbUser.stripeCustomerId,
      limit: 10,
      expand: ['data.items.data.price'],
    }),
    stripe.invoices.list({
      customer: dbUser.stripeCustomerId,
      limit: 24,
    }),
  ]);

  return NextResponse.json({
    plan: dbUser.plan,
    phoneNumber: dbUser.twilioNumber,
    subscriptions: subscriptions.data.map((sub) => {
      const expanded = sub as Stripe.Subscription & {
        current_period_end?: number;
        billing_cycle_anchor?: number;
        cancel_at_period_end?: boolean;
      };
      const price = sub.items.data[0]?.price as Stripe.Price | undefined;

      return {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: expanded.current_period_end ?? expanded.billing_cycle_anchor ?? 0,
        cancelAtPeriodEnd: expanded.cancel_at_period_end ?? false,
        amount: price?.unit_amount ?? 0,
        currency: sub.currency,
        interval: price?.recurring?.interval ?? 'month',
      };
    }),
    invoices: invoices.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      date: invoice.created,
      description: invoice.lines.data[0]?.description ?? 'Ring Ring Plan',
      pdf: invoice.invoice_pdf,
    })),
  });
}
