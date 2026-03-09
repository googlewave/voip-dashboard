import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

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
  if (!name || !phoneNumber) return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });

  const contact = await prisma.contact.create({
    data: { userId: user.id, name, phoneNumber, quickDialSlot },
  });
  return NextResponse.json(contact);
}
