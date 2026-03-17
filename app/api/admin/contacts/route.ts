import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, deviceId, name, phoneNumber, quickDialSlot } = await req.json();

    if (quickDialSlot && deviceId) {
      await prisma.contact.updateMany({
        where: { deviceId, quickDialSlot },
        data: { quickDialSlot: null },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        userId,
        deviceId: deviceId ?? null,
        name,
        phoneNumber,
        quickDialSlot: quickDialSlot ?? null,
      },
      select: {
        id: true,
        userId: true,
        deviceId: true,
        name: true,
        phoneNumber: true,
        quickDialSlot: true,
      },
    });

    return NextResponse.json({ contact });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { contactId, quickDialSlot, deviceId } = await req.json();

    if (quickDialSlot !== null && quickDialSlot !== undefined && deviceId) {
      await prisma.contact.updateMany({
        where: { deviceId, quickDialSlot, id: { not: contactId } },
        data: { quickDialSlot: null },
      });
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: { quickDialSlot: quickDialSlot ?? null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { contactId } = await req.json();
    await prisma.contact.delete({ where: { id: contactId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
