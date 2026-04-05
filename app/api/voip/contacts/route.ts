import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { normalizePhoneToE164 } from '@/lib/phone';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contacts = await prisma.contact.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, phoneNumber, quickDialSlot } = await req.json();
  const normalizedPhoneNumber = normalizePhoneToE164(phoneNumber);
  if (!name?.trim() || !normalizedPhoneNumber) return NextResponse.json({ error: 'Name and a valid E.164 phone number are required' }, { status: 400 });

  const contact = await prisma.contact.create({
    data: { userId: user.id, name: name.trim(), phoneNumber: normalizedPhoneNumber, quickDialSlot },
  });
  return NextResponse.json(contact);
}
