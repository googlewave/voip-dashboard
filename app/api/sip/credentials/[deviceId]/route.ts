import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { twilioClient } from '@/lib/twilio';

export async function GET(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cred = await prisma.sipCredential.findFirst({
    where: { deviceId: deviceId, userId: user.id },
  });

  if (!cred) return NextResponse.json({ error: 'No credentials found' }, { status: 404 });
  return NextResponse.json(cred);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cred = await prisma.sipCredential.findFirst({
    where: { deviceId: deviceId, userId: user.id },
  });

  if (!cred) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const lists = await twilioClient.sip.credentialLists.list();
  const credList = lists.find((l) => l.friendlyName === 'RingRingClub');
  if (credList) {
    await twilioClient.sip
      .credentialLists(credList.sid)
      .credentials(cred.twilioSid)
      .remove();
  }

  await prisma.sipCredential.delete({ where: { id: cred.id } });
  await prisma.device.updateMany({
    where: { id: deviceId, userId: user.id },
    data: { sipUsername: null, sipPassword: null, sipDomain: null },
  });

  return NextResponse.json({ success: true });
}
