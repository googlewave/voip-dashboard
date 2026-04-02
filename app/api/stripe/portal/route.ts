import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });

  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://voip-dashboard-sigma.vercel.app'}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
