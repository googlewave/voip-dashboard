import { NextRequest, NextResponse } from 'next/server';
import { twilioClient } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { deviceId, userId } = await req.json();

    const username = `sip_${deviceId.slice(-6)}_${Date.now()}`;
    const password = Math.random().toString(36).slice(-12) + 'A1!';

    // Step 1: Create in Twilio
    const credential = await twilioClient.sip
      .credentialLists(process.env.TWILIO_SIP_CRED_LIST_SID!)
      .credentials
      .create({ username, password });

    // Step 2: Update device with SIP credentials
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        sipUsername: username,
        sipPassword: password,
        sipDomain: process.env.TWILIO_SIP_DOMAIN,
      },
    });

    // Step 3: Upsert SipCredential record
    await prisma.sipCredential.upsert({
      where: { deviceId },
      update: {
        twilioSid: credential.sid,
        sipUsername: username,
        sipPassword: password,
      },
      create: {
        userId,
        deviceId,
        twilioSid: credential.sid,
        sipUsername: username,
        sipPassword: password,
      },
    });

    return NextResponse.json({
      success: true,
      sipUsername: username,
      sipPassword: password,
      twilioSid: credential.sid,
    });
  } catch (error: any) {
    console.error('SIP create error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create SIP user' },
      { status: 500 }
    );
  }
}
