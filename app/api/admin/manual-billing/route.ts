import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, plan, amount, note } = await req.json();

  // Update user plan without Stripe
  await prisma.user.update({
    where: { id: userId },
    data: { 
      plan,
      // Clear Stripe IDs if bypassing Stripe
      ...(amount === null && { stripeCustomerId: null, stripeSubId: null })
    },
  });

  // TODO: Log manual billing action with note for audit trail
  console.log(`Manual billing: User ${userId} set to ${plan}. Amount: ${amount || 'N/A'}. Note: ${note}`);

  return NextResponse.json({ success: true });
}
