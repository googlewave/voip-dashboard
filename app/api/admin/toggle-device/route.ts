import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { deviceId, status } = await req.json();

  await prisma.device.update({
    where: { id: deviceId },
    data: { isOnline: status },
  });

  return NextResponse.json({ success: true });
}
