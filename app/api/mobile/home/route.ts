import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsPreflight, jsonWithCors } from '@/lib/api-cors';
import { getMobileRequestUser } from '@/lib/mobile-auth';

async function loadOptionalProfileFields(userId: string) {
  try {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        e911Name: true,
        e911Street: true,
        e911City: true,
        e911State: true,
        e911Zip: true,
        twoFactorEnabled: true,
      },
    });

    return {
      twoFactorEnabled: profile?.twoFactorEnabled ?? false,
      e911: {
        name: profile?.e911Name ?? null,
        street: profile?.e911Street ?? null,
        city: profile?.e911City ?? null,
        state: profile?.e911State ?? null,
        zip: profile?.e911Zip ?? null,
      },
    };
  } catch (error) {
    console.warn('mobile/home optional profile fields unavailable', error);

    return {
      twoFactorEnabled: false,
      e911: {
        name: null,
        street: null,
        city: null,
        state: null,
        zip: null,
      },
    };
  }
}

async function loadOptionalDevicePresentationFields(userId: string) {
  try {
    const devices = await prisma.device.findMany({
      where: { userId },
      select: {
        id: true,
        macAddress: true,
        adapterType: true,
        provisioningStatus: true,
      },
    });

    return new Map(devices.map((device) => [device.id, device]));
  } catch (error) {
    console.warn('mobile/home optional device presentation fields unavailable', error);
    return new Map();
  }
}

async function loadOptionalDevicePolicyFields(userId: string) {
  try {
    const devices = await prisma.device.findMany({
      where: { userId },
      select: {
        id: true,
        quietHoursEnabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        usageCapEnabled: true,
        usageCapMinutes: true,
      },
    });

    return new Map(devices.map((device) => [device.id, device]));
  } catch (error) {
    console.warn('mobile/home optional device policy fields unavailable', error);
    return new Map();
  }
}

async function loadOptionalContactFields(userId: string) {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId },
      select: {
        id: true,
        contactType: true,
        sipUsername: true,
      },
    });

    return new Map(contacts.map((contact) => [contact.id, contact]));
  } catch (error) {
    console.warn('mobile/home optional contact fields unavailable', error);
    return new Map();
  }
}

export function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: NextRequest) {
  const authUser = await getMobileRequestUser(req);
  if (!authUser) {
    return jsonWithCors({ error: 'Unauthorized' }, { status: 401 });
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
        createdAt: true,
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
      },
    }),
    prisma.friendship.count({
      where: {
        OR: [{ userAId: authUser.id }, { userBId: authUser.id }],
      },
    }),
  ]);

  const [profileExtras, devicePresentationFields, devicePolicyFields, contactFields] = await Promise.all([
    loadOptionalProfileFields(authUser.id),
    loadOptionalDevicePresentationFields(authUser.id),
    loadOptionalDevicePolicyFields(authUser.id),
    loadOptionalContactFields(authUser.id),
  ]);

  const contactsByDeviceId = new Map<
    string,
    Array<
      (typeof contacts)[number] & {
        contactType: string | null;
        sipUsername: string | null;
      }
    >
  >();
  for (const contact of contacts) {
    const optionalContact = contactFields.get(contact.id);
    const list = contactsByDeviceId.get(contact.deviceId ?? '') ?? [];
    list.push({
      ...contact,
      contactType: optionalContact?.contactType ?? 'phone_number',
      sipUsername: optionalContact?.sipUsername ?? null,
    });
    contactsByDeviceId.set(contact.deviceId ?? '', list);
  }

  return jsonWithCors({
    profile: {
      id: profile?.id ?? authUser.id,
      email: profile?.email ?? authUser.email ?? '',
      plan: profile?.plan ?? 'free',
      twilioNumber: profile?.twilioNumber ?? null,
      areaCode: profile?.areaCode ?? null,
      stripeCustomerId: profile?.stripeCustomerId ?? null,
      stripeSubscriptionId: profile?.stripeSubId ?? null,
      twoFactorEnabled: profileExtras.twoFactorEnabled,
      e911: profileExtras.e911,
    },
    devices: devices.map((device) => {
      const presentation = devicePresentationFields.get(device.id);
      const policy = devicePolicyFields.get(device.id);

      return {
        id: device.id,
        name: device.name,
        phoneNumber: device.phoneNumber,
        isOnline: device.isOnline,
        sipUsername: device.sipUsername,
        macAddress: presentation?.macAddress ?? null,
        adapterType: presentation?.adapterType ?? null,
        createdAt: device.createdAt,
        quietHoursEnabled: policy?.quietHoursEnabled ?? false,
        quietHoursStart: policy?.quietHoursStart ?? null,
        quietHoursEnd: policy?.quietHoursEnd ?? null,
        usageCapEnabled: policy?.usageCapEnabled ?? false,
        usageCapMinutes: policy?.usageCapMinutes ?? null,
        provisioningStatus: presentation?.provisioningStatus ?? null,
        contacts: contactsByDeviceId.get(device.id) ?? [],
      };
    }),
    summary: {
      deviceCount: devices.length,
      contactCount: contacts.length,
      connectedFamilyCount: friendshipCount,
      activeLineCount: devices.filter((device) => !!device.sipUsername).length,
    },
  });
}
