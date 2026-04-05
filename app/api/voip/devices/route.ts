import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { normalizePhoneToE164 } from '@/lib/phone';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const devices = await prisma.device.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(devices);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phoneNumber, adapterType, adapterIp } = await req.json();
  const normalizedPhoneNumber = phoneNumber ? normalizePhoneToE164(phoneNumber) : null;
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (phoneNumber && !normalizedPhoneNumber) return NextResponse.json({ error: 'Phone number must be a valid E.164 number' }, { status: 400 });

  const device = await prisma.device.create({
    data: { userId: user.id, name, phoneNumber: normalizedPhoneNumber, adapterType, adapterIp },
  });
  return NextResponse.json(device);
}
