import { NextResponse } from 'next/server';
import { twilioClient, SIP_DOMAIN } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { deviceId, deviceName } = await req.json();
  if (!deviceId || !deviceName) {
    return NextResponse.json({ error: 'deviceId and deviceName required' }, { status: 400 });
  }

  try {
    const sipUsername = `${deviceName.toLowerCase().replace(/\s+/g, '_')}_${randomBytes(3).toString('hex')}`;
    const sipPassword = randomBytes(12).toString('hex');

    let credList;
    const existingLists = await twilioClient.sip.credentialLists.list();
    credList = existingLists.find((l) => l.friendlyName === 'RingRingClub');

    if (!credList) {
      credList = await twilioClient.sip.credentialLists.create({
        friendlyName: 'RingRingClub',
      });
    }

    const credential = await twilioClient.sip
      .credentialLists(credList.sid)
      .credentials.create({ username: sipUsername, password: sipPassword });

    await prisma.sipCredential.upsert({
      where: { deviceId },
      update: { twilioSid: credential.sid, sipUsername, sipPassword },
      create: {
        userId: user.id,
        deviceId,
        twilioSid: credential.sid,
        sipUsername,
        sipPassword,
      },
    });

    await prisma.device.updateMany({
      where: { id: deviceId, userId: user.id },
      data: { sipUsername, sipPassword, sipDomain: SIP_DOMAIN },
    });

    return NextResponse.json({
      success: true,
      sipUsername,
      sipPassword,
      sipDomain: SIP_DOMAIN,
      sipAddress: `sip:${sipUsername}@${SIP_DOMAIN}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
