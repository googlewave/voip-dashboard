import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

export async function POST() {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        twilioNumber: { not: null },
      },
      select: {
        id: true,
        email: true,
        twilioNumber: true,
      },
    });

    const results: {
      userId: string;
      email: string;
      phoneNumber: string;
      assignedDevice: string | null;
      fixed: boolean;
      reason: string;
    }[] = [];
    let fixedCount = 0;

    for (const currentUser of users) {
      const phoneNumber = currentUser.twilioNumber;
      if (!phoneNumber) {
        continue;
      }

      const devices = await prisma.device.findMany({
        where: { userId: currentUser.id },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      });

      if (devices.length === 0) {
        results.push({
          userId: currentUser.id,
          email: currentUser.email,
          phoneNumber,
          assignedDevice: null,
          fixed: false,
          reason: 'No devices',
        });
        continue;
      }

      const alreadyAssigned = devices.find((device) => device.phoneNumber === phoneNumber);
      if (alreadyAssigned) {
        results.push({
          userId: currentUser.id,
          email: currentUser.email,
          phoneNumber,
          assignedDevice: alreadyAssigned.name,
          fixed: false,
          reason: 'Already assigned',
        });
        continue;
      }

      const deviceWithoutLine = devices.find((device) => !device.phoneNumber);
      const targetDevice = deviceWithoutLine ?? (devices.length === 1 ? devices[0] : null);

      if (!targetDevice) {
        results.push({
          userId: currentUser.id,
          email: currentUser.email,
          phoneNumber,
          assignedDevice: null,
          fixed: false,
          reason: 'Multiple devices already have lines',
        });
        continue;
      }

      await prisma.device.update({
        where: { id: targetDevice.id },
        data: { phoneNumber },
      });

      fixedCount++;
      results.push({
        userId: currentUser.id,
        email: currentUser.email,
        phoneNumber,
        assignedDevice: targetDevice.name,
        fixed: true,
        reason: deviceWithoutLine ? 'Assigned to device without line' : 'Assigned to only device',
      });
    }

    return NextResponse.json({
      success: true,
      total: users.length,
      fixed: fixedCount,
      results,
    });
  } catch (error: any) {
    console.error('Fix device lines error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}