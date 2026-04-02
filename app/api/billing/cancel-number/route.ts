import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.twilioNumberSid) {
    return NextResponse.json({ error: 'No phone number to cancel' }, { status: 400 });
  }

  // Release Twilio number
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    await client.incomingPhoneNumbers(dbUser.twilioNumberSid).remove();
  } catch (err) {
    console.error('Twilio number release failed:', err);
    // Continue — update DB regardless so user isn't stuck
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twilioNumber: null,
      twilioNumberSid: null,
      plan: 'free',
      stripe_subscription_id: null,
    },
  });

  return NextResponse.json({ success: true });
}
