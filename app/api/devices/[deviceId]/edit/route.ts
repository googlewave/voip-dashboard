import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeAdapterType } from '@/lib/voip/adapters';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params;
    const { name, macAddress, adapterType, phoneNumber } = await req.json();
    const normalizedAdapterType = normalizeAdapterType(adapterType);

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Device name is required' },
        { status: 400 }
      );
    }

    if (!normalizedAdapterType) {
      return NextResponse.json(
        { error: 'A supported adapter type is required' },
        { status: 400 }
      );
    }

    if (!macAddress?.trim()) {
      return NextResponse.json(
        { error: 'MAC address is required' },
        { status: 400 }
      );
    }

    // Normalize MAC address
    let normalizedMac: string | undefined;
    if (macAddress && macAddress.trim()) {
      const hex = macAddress.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
      if (hex.length === 12) {
        normalizedMac = hex.match(/.{2}/g)!.join(':');
      } else if (hex.length > 0) {
        return NextResponse.json(
          { error: 'Invalid MAC address format. Expected 12 hex characters (e.g. C0:74:AD:12:34:56)' },
          { status: 400 }
        );
      }
    }

    // Check if MAC address is already used by another device
    if (normalizedMac) {
      const existingDevice = await prisma.device.findFirst({
        where: {
          macAddress: normalizedMac,
          id: { not: deviceId },
        },
      });
      
      if (existingDevice) {
        return NextResponse.json(
          { error: 'MAC address is already assigned to another device' },
          { status: 409 }
        );
      }
    }

    // Update the device
    const device = await prisma.device.update({
      where: { id: deviceId },
      data: {
        name: name.trim(),
        adapterType: normalizedAdapterType,
        macAddress: normalizedMac,
        phoneNumber: phoneNumber?.trim() || null,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        phoneNumber: true,
        sipUsername: true,
        sipPassword: true,
        sipDomain: true,
        macAddress: true,
        adapterType: true,
        adapterIp: true,
        isOnline: true,
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        usageCapEnabled: true,
        usageCapMinutes: true,
        lastProvisionedAt: true,
        provisioningStatus: true,
        configVersion: true,
        lastSeenIp: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, device });
  } catch (error: any) {
    console.error('Device edit error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message ?? 'Failed to update device' },
      { status: 500 }
    );
  }
}
