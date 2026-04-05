import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

type ProvisioningLogRow = {
  deviceId: string;
  timestamp: Date;
  status: string;
  ipAddress: string | null;
  userAgent: string | null;
  errorMessage: string | null;
};

type DeviceRegistrationRow = {
  deviceId: string;
  registeredAt: Date;
  expiresAt: Date | null;
  ipAddress: string | null;
  status: string;
};

function groupByDeviceId<T extends { deviceId: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const existing = grouped.get(row.deviceId) ?? [];
    existing.push(row);
    grouped.set(row.deviceId, existing);
  }
  return grouped;
}

export async function GET() {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const devices = await prisma.device.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      name: true,
      phoneNumber: true,
      isOnline: true,
      sipUsername: true,
      adapterType: true,
      macAddress: true,
      adapterIp: true,
      lastProvisionedAt: true,
      provisioningStatus: true,
      configVersion: true,
      lastSeenIp: true,
      createdAt: true,
    },
  });

  const deviceIds = devices.map((device) => device.id);

  const provisioningLogs: ProvisioningLogRow[] = deviceIds.length
    ? await prisma.provisioningLog.findMany({
        where: { deviceId: { in: deviceIds } },
        orderBy: { timestamp: 'desc' },
        take: Math.max(deviceIds.length * 4, 40),
      })
    : [];

  const registrations: DeviceRegistrationRow[] = deviceIds.length
    ? await prisma.deviceRegistration.findMany({
        where: { deviceId: { in: deviceIds } },
        orderBy: { registeredAt: 'desc' },
        take: Math.max(deviceIds.length * 2, 20),
      })
    : [];

  const networkTests = deviceIds.length
    ? await prisma.networkTestLog.findMany({
        where: { deviceId: { in: deviceIds } },
        orderBy: { createdAt: 'desc' },
        take: Math.max(deviceIds.length * 2, 20),
      })
    : [];

  const logsByDevice = groupByDeviceId(provisioningLogs);
  const registrationsByDevice = groupByDeviceId(registrations);
  const networkTestsByDevice = groupByDeviceId(networkTests);
  const now = Date.now();

  const diagnostics = devices.map((device) => {
    const recentLogs = (logsByDevice.get(device.id) ?? []).slice(0, 3);
    const latestLog = recentLogs[0] ?? null;
    const latestRegistration = (registrationsByDevice.get(device.id) ?? [])[0] ?? null;
    const latestNetworkTest = (networkTestsByDevice.get(device.id) ?? [])[0] ?? null;
    const activeRegistration = latestRegistration?.expiresAt
      ? latestRegistration.expiresAt.getTime() > now
      : device.isOnline;

    const health = device.provisioningStatus === 'failed'
      ? 'error'
      : !device.lastProvisionedAt
        ? 'pending'
        : device.isOnline
          ? 'healthy'
          : device.sipUsername
            ? 'warning'
            : 'pending';

    return {
      id: device.id,
      name: device.name,
      userId: device.userId,
      phoneNumber: device.phoneNumber,
      adapterType: device.adapterType,
      macAddress: device.macAddress,
      adapterIp: device.adapterIp,
      sipReady: Boolean(device.sipUsername),
      online: device.isOnline,
      health,
      provisioningStatus: device.provisioningStatus ?? 'unknown',
      lastProvisionedAt: device.lastProvisionedAt?.toISOString() ?? null,
      configVersion: device.configVersion,
      lastSeenIp: device.lastSeenIp,
      latestLog: latestLog
        ? {
            timestamp: latestLog.timestamp.toISOString(),
            status: latestLog.status,
            ipAddress: latestLog.ipAddress,
            userAgent: latestLog.userAgent,
            errorMessage: latestLog.errorMessage,
          }
        : null,
      recentLogs: recentLogs.map((log) => ({
        timestamp: log.timestamp.toISOString(),
        status: log.status,
        ipAddress: log.ipAddress,
        errorMessage: log.errorMessage,
      })),
      networkTest: latestNetworkTest
        ? {
            createdAt: latestNetworkTest.createdAt.toISOString(),
            outcome: latestNetworkTest.outcome,
            summary: latestNetworkTest.summary,
          }
        : null,
      registration: latestRegistration
        ? {
            registeredAt: latestRegistration.registeredAt.toISOString(),
            expiresAt: latestRegistration.expiresAt?.toISOString() ?? null,
            ipAddress: latestRegistration.ipAddress,
            status: latestRegistration.status,
            active: activeRegistration,
          }
        : {
            registeredAt: null,
            expiresAt: null,
            ipAddress: null,
            status: device.isOnline ? 'online-proxy' : 'not-recorded',
            active: device.isOnline,
          },
    };
  });

  const summary = {
    totalDevices: diagnostics.length,
    healthy: diagnostics.filter((device) => device.health === 'healthy').length,
    warning: diagnostics.filter((device) => device.health === 'warning').length,
    error: diagnostics.filter((device) => device.health === 'error').length,
    pending: diagnostics.filter((device) => device.health === 'pending').length,
    online: diagnostics.filter((device) => device.online).length,
    sipReady: diagnostics.filter((device) => device.sipReady).length,
    recentFailures: diagnostics.filter((device) => device.latestLog?.status === 'failed').length,
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    summary,
    devices: diagnostics,
  });
}