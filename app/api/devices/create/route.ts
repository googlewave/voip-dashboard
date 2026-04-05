import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeAdapterType } from '@/lib/voip/adapters';

export async function POST(req: NextRequest) {
  try {
    const { userId, name, adapterType, macAddress, phoneNumber } = await req.json();
    const normalizedAdapterType = normalizeAdapterType(adapterType);

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId and name are required' },
        { status: 400 }
      );
    }

    if (!normalizedAdapterType) {
      return NextResponse.json(
        { error: 'A supported adapter type is required' },
        { status: 400 }
      );
    }

    if (!macAddress || !macAddress.trim()) {
      return NextResponse.json(
        { error: 'MAC address is required' },
        { status: 400 }
      );
    }

    // Normalize MAC address to uppercase colon-separated format
    let normalizedMac: string | undefined;
    if (macAddress && macAddress.trim()) {
      const hex = macAddress.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      if (hex.length === 12) {
        normalizedMac = hex.match(/.{2}/g)!.join(':');
      } else {
        return NextResponse.json(
          { error: 'Invalid MAC address format. Expected 12 hex characters (e.g. C0:74:AD:12:34:56)' },
          { status: 400 }
        );
      }
    }

    const existingDevice = await prisma.device.findFirst({
      where: { macAddress: normalizedMac },
      select: { id: true },
    });

    if (existingDevice) {
      return NextResponse.json(
        { error: 'MAC address is already assigned to another device' },
        { status: 409 }
      );
    }

    const device = await prisma.device.create({
      data: {
        userId,
        name,
        adapterType: normalizedAdapterType,
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
