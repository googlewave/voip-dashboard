import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const { deviceId, isOnline } = await req.json();
    if (!deviceId) return NextResponse.json({ error: 'deviceId required' }, { status: 400 });

    const device = await prisma.device.update({
      where: { id: deviceId },
      data: { isOnline },
    });

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) return NextResponse.json({ error: 'deviceId required' }, { status: 400 });

    await prisma.contact.deleteMany({ where: { deviceId } });
    await prisma.device.delete({ where: { id: deviceId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
