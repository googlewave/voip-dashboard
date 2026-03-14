import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, name, adapterType } = await req.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    const device = await prisma.device.create({
      data: {
        userId,
        name,
        adapterType,
        isOnline: false,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        sipUsername: true,
        adapterType: true,
        adapterIp: true,
      },
    });

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    console.error('Device create error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create device' },
      { status: 500 }
    );
  }
}
