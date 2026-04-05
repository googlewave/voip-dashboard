import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';
import { getAdapterLabel, getProvisioningFamily, getProvisioningQueryType } from '@/lib/voip/adapters';

const ADMIN_EMAILS = ['bliuser@gmail.com', 'christophepoirrier@gmail.com'];

function looksLikeProvisioningBody(body: string) {
  return /<flat-profile>|<gs_provision|Provisioning failed|Device not found/i.test(body);
}

function getCheckStateLabel(passed: boolean) {
  return passed ? 'pass' : 'fail';
}

async function fetchProvisioningUrl(url: string, userAgent: string) {
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'User-Agent': userAgent,
    },
  });
  const body = await response.text();

  return {
    url,
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get('content-type'),
    durationMs: Date.now() - startedAt,
    looksLikeProvisioning: looksLikeProvisioningBody(body),
    profileRulePresent: /<Profile_Rule>.*<\/Profile_Rule>/i.test(body),
    preview: body.slice(0, 220),
    body,
  };
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { deviceId } = await req.json();
  if (!deviceId || typeof deviceId !== 'string') {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: {
      id: true,
      name: true,
      adapterType: true,
      macAddress: true,
      sipUsername: true,
      sipPassword: true,
    },
  });

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  const adapterLabel = getAdapterLabel(device.adapterType);
  const provisioningFamily = getProvisioningFamily(device.adapterType);
  const provisioningQueryType = getProvisioningQueryType(device.adapterType);
  const normalizedMac = device.macAddress?.replace(/[^a-fA-F0-9]/g, '').toLowerCase() ?? '';
  const baseUrl = req.nextUrl.origin;
  const autoUrl = `${baseUrl}/api/provision/auto/${device.id}?type=${provisioningQueryType}`;
  const macUrl = normalizedMac ? `${baseUrl}/api/provision/mac/${normalizedMac}` : null;
  const userAgent = provisioningFamily === 'grandstream' ? 'Grandstream/HT801' : 'Cisco/SPA122-7.6.2';

  const checks: Array<{ label: string; passed: boolean; details: string }> = [];

  checks.push({
    label: 'Adapter model set',
    passed: Boolean(device.adapterType),
    details: adapterLabel,
  });

  checks.push({
    label: 'MAC address present',
    passed: Boolean(normalizedMac),
    details: device.macAddress || 'Missing MAC address',
  });

  const autoResponse = await fetchProvisioningUrl(autoUrl, userAgent);
  checks.push({
    label: 'Auto URL returns provisioning content',
    passed: autoResponse.ok && autoResponse.looksLikeProvisioning,
    details: `HTTP ${autoResponse.status} in ${autoResponse.durationMs}ms`,
  });

  let macResponse: Awaited<ReturnType<typeof fetchProvisioningUrl>> | null = null;
  if (macUrl) {
    macResponse = await fetchProvisioningUrl(macUrl, userAgent);
    checks.push({
      label: 'MAC URL returns provisioning content',
      passed: macResponse.ok && macResponse.looksLikeProvisioning,
      details: `HTTP ${macResponse.status} in ${macResponse.durationMs}ms`,
    });

    if (provisioningFamily === 'spa') {
      const profileRulePointsToMac = macResponse.body.includes(`/api/provision/mac/${normalizedMac}`);
      checks.push({
        label: 'SPA profile rule points back to MAC URL',
        passed: macResponse.profileRulePresent && profileRulePointsToMac,
        details: profileRulePointsToMac
          ? 'Profile_Rule points to the MAC-based provisioning endpoint'
          : 'Profile_Rule missing or not pointing to the MAC-based endpoint',
      });
    }
  }

  const passedChecks = checks.filter((check) => check.passed).length;
  const verdict = checks.every((check) => check.passed)
    ? 'pass'
    : passedChecks >= Math.max(1, checks.length - 1)
      ? 'warn'
      : 'fail';

  const summary = verdict === 'pass'
    ? `${adapterLabel} looks ready for live MAC-based provisioning.`
    : verdict === 'warn'
      ? `${adapterLabel} is close, but one check still needs attention.`
      : `${adapterLabel} is not ready for live MAC-based provisioning yet.`;

  return NextResponse.json({
    deviceId: device.id,
    deviceName: device.name,
    adapterLabel,
    provisioningFamily,
    provisioningQueryType,
    verdict,
    verdictLabel: getCheckStateLabel(verdict === 'pass'),
    summary,
    urls: {
      autoUrl,
      macUrl,
    },
    sipReady: Boolean(device.sipUsername && device.sipPassword),
    checks,
    responses: {
      auto: {
        status: autoResponse.status,
        contentType: autoResponse.contentType,
        durationMs: autoResponse.durationMs,
        preview: autoResponse.preview,
      },
      mac: macResponse
        ? {
            status: macResponse.status,
            contentType: macResponse.contentType,
            durationMs: macResponse.durationMs,
            preview: macResponse.preview,
          }
        : null,
    },
  });
}