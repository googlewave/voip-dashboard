import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

/**
 * Admin endpoint to ensure all provisioned Twilio numbers have the correct voice webhook.
 * Safe to run multiple times.
 */
export async function POST() {
  try {
    const voiceWebhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice`;

    // Get all numbers from Twilio
    const numbers = await twilioClient.incomingPhoneNumbers.list({ limit: 100 });

    const results: { number: string; was: string | null; fixed: boolean }[] = [];
    let fixedCount = 0;

    for (const num of numbers) {
      const alreadyCorrect = num.voiceUrl === voiceWebhookUrl;
      if (!alreadyCorrect) {
        await twilioClient.incomingPhoneNumbers(num.sid).update({
          voiceUrl: voiceWebhookUrl,
          voiceMethod: 'POST',
        });
        fixedCount++;
      }
      results.push({
        number: num.phoneNumber,
        was: num.voiceUrl || null,
        fixed: !alreadyCorrect,
      });
    }

    return NextResponse.json({
      success: true,
      total: numbers.length,
      fixed: fixedCount,
      results,
    });
  } catch (err: any) {
    console.error('Fix webhooks error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
