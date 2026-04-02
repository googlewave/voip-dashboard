import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { deviceId } = await req.json();

  // Delete contacts first
  await prisma.contact.deleteMany({ where: { deviceId } });
  
  // Delete device
  await prisma.device.delete({ where: { id: deviceId } });

  return NextResponse.json({ success: true });
}
