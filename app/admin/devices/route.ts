import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: NextRequest) {
  try {
    const { deviceId } = await req.json();
    await prisma.contact.deleteMany({ where: { deviceId } });
    await prisma.device.delete({ where: { id: deviceId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { deviceId, isOnline } = await req.json();
    await prisma.device.update({
      where: { id: deviceId },
      data: { isOnline },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
