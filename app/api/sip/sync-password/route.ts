import { NextRequest, NextResponse } from 'next/server';
import { twilioClient } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { deviceId, sipUsername, password } = await req.json();

    if ((!deviceId && !sipUsername) || !password) {
      return NextResponse.json({ error: 'deviceId or sipUsername, plus password are required' }, { status: 400 });
    }

    // Look up the device
    const device = deviceId
      ? await prisma.device.findUnique({ where: { id: deviceId } })
      : await prisma.device.findFirst({ where: { sipUsername } });

    if (!device) {
      return NextResponse.json({ error: 'No device found' }, { status: 404 });
    }

    const cred = await prisma.sipCredential.findUnique({ where: { deviceId: device.id } });

    // Update Twilio — use stored SID if available, otherwise look up by username
    let twilioUpdated = false;
    const credListSid = process.env.TWILIO_SIP_CRED_LIST_SID!;
    let twilioSid = cred?.twilioSid;
    
    if (!twilioSid) {
      const all = await twilioClient.sip.credentialLists(credListSid).credentials.list();
      twilioSid = all.find(c => c.username === device.sipUsername)?.sid ?? undefined;
    }

    if (twilioSid) {
      await twilioClient.sip
        .credentialLists(credListSid)
        .credentials(twilioSid)
        .update({ password });
      twilioUpdated = true;
    }

    // Always update the DB
    await prisma.device.update({
      where: { id: device.id },
      data: { sipPassword: password },
    });

    if (cred) {
      await prisma.sipCredential.update({
        where: { deviceId: device.id },
        data: { sipPassword: password },
      });
    }

    return NextResponse.json({
      success: true,
      sipUsername: device.sipUsername,
      twilioUpdated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync password';
    console.error('SIP sync-password error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
