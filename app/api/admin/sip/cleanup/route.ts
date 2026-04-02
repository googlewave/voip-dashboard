import { NextResponse } from 'next/server';
import { twilioClient } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const credListSid = process.env.TWILIO_SIP_CRED_LIST_SID!;

    // All credentials in Twilio
    const twilioCreds = await twilioClient.sip
      .credentialLists(credListSid)
      .credentials
      .list();

    // All active SIP usernames in our DB
    const activeDevices = await prisma.device.findMany({
      where: { sipUsername: { not: null } },
      select: { sipUsername: true },
    });
    const activeUsernames = new Set(activeDevices.map((d) => d.sipUsername));

    // Also keep any username linked in SipCredential that has an active device
    const activeSipCreds = await prisma.sipCredential.findMany({
      select: { twilioSid: true, sipUsername: true },
    });
    const activeCredSids = new Set(
      activeSipCreds
        .filter((c) => activeUsernames.has(c.sipUsername))
        .map((c) => c.twilioSid)
    );

    const toDelete = twilioCreds.filter((c) => !activeCredSids.has(c.sid));

    let deleted = 0;
    for (const cred of toDelete) {
      try {
        await twilioClient.sip
          .credentialLists(credListSid)
          .credentials(cred.sid)
          .remove();

        // Also clean up orphaned SipCredential rows in DB
        await prisma.sipCredential.deleteMany({
          where: { twilioSid: cred.sid },
        });

        deleted++;
      } catch {
        // Skip if already gone
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      total: twilioCreds.length,
      kept: twilioCreds.length - deleted,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
