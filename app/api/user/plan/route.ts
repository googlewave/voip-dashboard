import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  return NextResponse.json({ plan: dbUser?.plan || 'free' });
}

export async function PATCH(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { plan } = await req.json();
  if (!['free', 'paid'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  await prisma.user.upsert({
    where: { id: user.id },
    update: { plan },
    create: { id: user.id, email: user.email!, plan },
  });

  return NextResponse.json({ success: true, plan });
}
