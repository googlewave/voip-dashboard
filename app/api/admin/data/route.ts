import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export async function GET() {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { id: 'desc' },
    select: {
      id: true,
      email: true,
      plan: true,
      twilioNumber: true,
      areaCode: true,
      stripeCustomerId: true,
      stripeSubId: true,
      twilioNumberSid: true,
    },
  });

  const devices = await prisma.device.findMany({
    orderBy: { id: 'desc' },
  });

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      deviceId: true,
      name: true,
      phoneNumber: true,
      quickDialSlot: true,
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      stripeSubscriptionId: u.stripeSubId || null,
      twilioNumberSid: u.twilioNumberSid || null,
    })),
    devices: devices.map(d => ({
      ...d,
      status: d.isOnline,
    })),
    contacts: contacts.map(c => ({
      ...c,
      phone: c.phoneNumber,
    })),
  });
}
