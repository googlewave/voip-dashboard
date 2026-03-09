import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const contact = await prisma.contact.updateMany({
    where: { id: params.id, userId: user.id },
    data,
  });
  return NextResponse.json(contact);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.contact.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  return NextResponse.json({ success: true });
}
