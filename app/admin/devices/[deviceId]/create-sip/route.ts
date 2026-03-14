// app/api/admin/devices/[deviceId]/create-sip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const client = twilio(accountSid, authToken);

// This is the CredentialList SID you attach to your SIP Domain in Twilio Console
const CREDENTIAL_LIST_SID = process.env.TWILIO_SIP_CRED_LIST_SID!;
// Your Twilio SIP domain, e.g. ringringclub.sip.us1.twilio.com
const SIP_DOMAIN = process.env.TWILIO_SIP_DOMAIN!;

export async function POST(
  req: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can call this
    if (user.email !== 'you@example.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deviceId = params.deviceId;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Generate username/password
    const username = `u_${deviceId.slice(0, 8)}`;
    const password = Math.random().toString(36).slice(2, 12);

    // Create SIP Credential in Twilio
    const credential = await client.sip
      .credentialLists(CREDENTIAL_LIST_SID)
      .credentials.create({
        username,
        password,
      });

    // Store on Device and SipCredential
    await prisma.$transaction([
      prisma.device.update({
        where: { id: deviceId },
        data: {
          sipUsername: username,
          sipPassword: password,
          sipDomain: SIP_DOMAIN,
        },
      }),
      prisma.sipCredential.upsert({
        where: { deviceId: deviceId },
        update: {
          twilioSid: credential.sid,
          sipUsername: username,
          sipPassword: password,
        },
        create: {
          userId: device.userId,
          deviceId: deviceId,
          twilioSid: credential.sid,
          sipUsername: username,
          sipPassword: password,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      sipUsername: username,
      sipPassword: password,
      sipDomain: SIP_DOMAIN,
      twilioSid: credential.sid,
    });
  } catch (err) {
    console.error('Create SIP for device error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
