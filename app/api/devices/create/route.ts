import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId, name, adapterType, macAddress, phoneNumber } = await req.json();

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    // Normalize MAC address to uppercase colon-separated format
    let normalizedMac: string | undefined;
    if (macAddress && macAddress.trim()) {
      const hex = macAddress.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      if (hex.length === 12) {
        normalizedMac = hex.match(/.{2}/g)!.join(':');
      }
    }

    const device = await prisma.device.create({
      data: {
        userId,
        name,
        adapterType,
        macAddress: normalizedMac,
        isOnline: false,
        phoneNumber: phoneNumber || null,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        sipUsername: true,
        macAddress: true,
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
