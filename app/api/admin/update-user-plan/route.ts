import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, plan } = await req.json();

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  });

  return NextResponse.json({ success: true });
}
