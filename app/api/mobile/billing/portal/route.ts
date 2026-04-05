import { NextRequest, NextResponse } from 'next/server';
import { corsPreflight, jsonWithCors } from '@/lib/api-cors';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { getMobileRequestUser } from '@/lib/mobile-auth';

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  const authUser = await getMobileRequestUser(req);
  if (!authUser) {
    return jsonWithCors({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { stripeCustomerId: true },
  });

  if (!dbUser?.stripeCustomerId) {
    return jsonWithCors({ error: 'No billing account found' }, { status: 400 });
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://voip-dashboard-sigma.vercel.app';

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  });

  return jsonWithCors({ url: session.url });
}
