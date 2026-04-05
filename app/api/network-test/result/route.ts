import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { analyzeNetworkTest, type NetworkTestProbe } from '@/lib/voip/network-test';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

function getClientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

async function canAccessDevice(deviceId: string, userId: string, email?: string | null) {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: { id: true, userId: true },
  });

  if (!device) {
    return { allowed: false, reason: 'Device not found' } as const;
  }

  if (device.userId === userId || ADMIN_EMAILS.includes(email ?? '')) {
    return { allowed: true, device } as const;
  }

  return { allowed: false, reason: 'Unauthorized' } as const;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deviceId = req.nextUrl.searchParams.get('deviceId');
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
  }

  const access = await canAccessDevice(deviceId, user.id, user.email);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: access.reason === 'Device not found' ? 404 : 403 });
  }

  const latest = await prisma.networkTestLog.findFirst({
    where: { deviceId },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) {
    return NextResponse.json({ result: null });
  }

  return NextResponse.json({
    result: {
      id: latest.id,
      deviceId: latest.deviceId,
      provisioningUrl: latest.provisioningUrl,
      outcome: latest.outcome,
      summary: latest.summary,
      createdAt: latest.createdAt.toISOString(),
      clientIp: latest.clientIp,
      browser: {
        ok: latest.browserOk,
        status: latest.browserStatus ?? 0,
        durationMs: latest.browserLatencyMs ?? 0,
        looksLikeProvisioning: latest.browserLooksLikeProvisioning,
        error: latest.browserError,
      },
      server: {
        ok: latest.serverOk,
        status: latest.serverStatus ?? 0,
        durationMs: latest.serverLatencyMs ?? 0,
        looksLikeProvisioning: latest.serverLooksLikeProvisioning,
        error: latest.serverError,
      },
      analysis: analyzeNetworkTest(
        {
          ok: latest.browserOk,
          status: latest.browserStatus ?? 0,
          durationMs: latest.browserLatencyMs ?? 0,
          looksLikeProvisioning: latest.browserLooksLikeProvisioning,
          error: latest.browserError,
        },
        {
          ok: latest.serverOk,
          status: latest.serverStatus ?? 0,
          durationMs: latest.serverLatencyMs ?? 0,
          looksLikeProvisioning: latest.serverLooksLikeProvisioning,
          error: latest.serverError,
        }
      ),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const browser = body.browser as NetworkTestProbe | undefined;
  const server = body.server as NetworkTestProbe | undefined;

  if (!browser || !server) {
    return NextResponse.json({ error: 'browser and server results are required' }, { status: 400 });
  }

  const analysis = analyzeNetworkTest(browser, server);
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : null;
  const provisioningUrl = typeof body.provisioningUrl === 'string' ? body.provisioningUrl : '';

  if (!deviceId) {
    return NextResponse.json({ persisted: false, analysis });
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const access = await canAccessDevice(deviceId, user.id, user.email);
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason }, { status: access.reason === 'Device not found' ? 404 : 403 });
  }

  const saved = await prisma.networkTestLog.create({
    data: {
      userId: access.device.userId,
      deviceId,
      provisioningUrl,
      clientIp: getClientIp(req),
      userAgent: req.headers.get('user-agent') || 'unknown',
      browserOk: browser.ok,
      browserStatus: browser.status || null,
      browserLatencyMs: browser.durationMs || null,
      browserLooksLikeProvisioning: browser.looksLikeProvisioning,
      browserError: browser.error || null,
      serverOk: server.ok,
      serverStatus: server.status || null,
      serverLatencyMs: server.durationMs || null,
      serverLooksLikeProvisioning: server.looksLikeProvisioning,
      serverError: server.error || null,
      outcome: analysis.outcome,
      summary: analysis.summary,
    },
  });

  return NextResponse.json({
    persisted: true,
    analysis,
    result: {
      id: saved.id,
      createdAt: saved.createdAt.toISOString(),
      outcome: saved.outcome,
      summary: saved.summary,
    },
  });
}