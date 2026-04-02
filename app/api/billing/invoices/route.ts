import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.stripeCustomerId) return NextResponse.json({ invoices: [] });

  const invoices = await stripe.invoices.list({
    customer: dbUser.stripeCustomerId,
    limit: 24,
  });

  return NextResponse.json({
    invoices: invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      date: inv.created,
      description: inv.lines.data[0]?.description ?? 'Ring Ring Plan',
      pdf: inv.invoice_pdf,
    })),
  });
}
