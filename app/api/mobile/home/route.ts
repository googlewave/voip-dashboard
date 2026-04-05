import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getMobileRequestUser } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const authUser = await getMobileRequestUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile, devices, contacts, friendshipCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        plan: true,
        twilioNumber: true,
        areaCode: true,
        stripeCustomerId: true,
        stripeSubId: true,
        e911Name: true,
        e911Street: true,
        e911City: true,
        e911State: true,
        e911Zip: true,
        twoFactorEnabled: true,
      },
    }),
    prisma.device.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        isOnline: true,
        sipUsername: true,
        macAddress: true,
        adapterType: true,
        createdAt: true,
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        usageCapEnabled: true,
        usageCapMinutes: true,
        provisioningStatus: true,
      },
    }),
    prisma.contact.findMany({
      where: { userId: authUser.id },
      orderBy: [{ quickDialSlot: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        deviceId: true,
        name: true,
        phoneNumber: true,
        quickDialSlot: true,
        contactType: true,
        sipUsername: true,
      },
    }),
    prisma.friendship.count({
      where: {
        OR: [{ userAId: authUser.id }, { userBId: authUser.id }],
      },
    }),
  ]);

  const contactsByDeviceId = new Map<string, typeof contacts>();
  for (const contact of contacts) {
    const list = contactsByDeviceId.get(contact.deviceId ?? '') ?? [];
    list.push(contact);
    contactsByDeviceId.set(contact.deviceId ?? '', list);
  }

  return NextResponse.json({
    profile: {
      id: profile?.id ?? authUser.id,
      email: profile?.email ?? authUser.email ?? '',
      plan: profile?.plan ?? 'free',
      twilioNumber: profile?.twilioNumber ?? null,
      areaCode: profile?.areaCode ?? null,
      stripeCustomerId: profile?.stripeCustomerId ?? null,
      stripeSubscriptionId: profile?.stripeSubId ?? null,
      twoFactorEnabled: profile?.twoFactorEnabled ?? false,
      e911: {
        name: profile?.e911Name ?? null,
        street: profile?.e911Street ?? null,
        city: profile?.e911City ?? null,
        state: profile?.e911State ?? null,
        zip: profile?.e911Zip ?? null,
      },
    },
    devices: devices.map((device) => ({
      id: device.id,
      name: device.name,
      phoneNumber: device.phoneNumber,
      isOnline: device.isOnline,
      sipUsername: device.sipUsername,
      macAddress: device.macAddress,
      adapterType: device.adapterType,
      createdAt: device.createdAt,
      quietHoursEnabled: device.quietHoursEnabled,
      quietHoursStart: device.quietHoursStart,
      quietHoursEnd: device.quietHoursEnd,
      usageCapEnabled: device.usageCapEnabled,
      usageCapMinutes: device.usageCapMinutes,
      provisioningStatus: device.provisioningStatus,
      contacts: contactsByDeviceId.get(device.id) ?? [],
    })),
    summary: {
      deviceCount: devices.length,
      contactCount: contacts.length,
      connectedFamilyCount: friendshipCount,
      activeLineCount: devices.filter((device) => !!device.sipUsername).length,
    },
  });
}
