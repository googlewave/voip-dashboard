import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { twilioClient } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const { deviceId } = await req.json();

    // Find existing SIP credential record
    const existing = await prisma.sipCredential.findUnique({
      where: { deviceId },
    });

    // Delete from Twilio if exists
    if (existing?.twilioSid) {
      try {
        await twilioClient.sip
          .credentialLists(process.env.TWILIO_SIP_CRED_LIST_SID!)
          .credentials(existing.twilioSid)
          .remove();
      } catch (e) {
        // Ignore if already deleted in Twilio
      }
    }

    // Only clear sipUsername — the one column we know exists
    await prisma.device.update({
      where: { id: deviceId },
      data: { sipUsername: null },
    });

    // Delete SipCredential record
    if (existing) {
      await prisma.sipCredential.delete({ where: { deviceId } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SIP reset error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to reset SIP' },
      { status: 500 }
    );
  }
}
