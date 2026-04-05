import { NextRequest, NextResponse } from 'next/server';

function getClientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function getAllowedHosts(req: NextRequest) {
  const allowedHosts = new Set<string>([req.nextUrl.host]);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) {
    try {
      allowedHosts.add(new URL(baseUrl).host);
    } catch {
      // Ignore malformed env values in diagnostics endpoint.
    }
  }
  return allowedHosts;
}

function looksLikeProvisioningBody(body: string) {
  return /<flat-profile>|<gs_provision|Provisioning failed|Device not found/i.test(body);
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    origin: req.nextUrl.origin,
    host: req.nextUrl.host,
    clientIp: getClientIp(req),
    userAgent: req.headers.get('user-agent') || 'unknown',
    online: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'A provisioning URL is required.' }, { status: 400 });
    }

    const targetUrl = new URL(url, req.nextUrl.origin);
    const allowedHosts = getAllowedHosts(req);

    if (!allowedHosts.has(targetUrl.host)) {
      return NextResponse.json({ error: 'Only Ring Ring provisioning URLs can be tested here.' }, { status: 400 });
    }

    if (targetUrl.pathname.startsWith('/api/network-test')) {
      return NextResponse.json({ error: 'Choose a provisioning URL, not the network test endpoint.' }, { status: 400 });
    }

    const startedAt = Date.now();
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'User-Agent': 'ringring-network-test',
      },
    });
    const body = await response.text();
    const durationMs = Date.now() - startedAt;

    return NextResponse.json({
      ok: response.ok,
      checkedAt: new Date().toISOString(),
      durationMs,
      targetUrl: targetUrl.toString(),
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      matchedPath: response.headers.get('x-matched-path'),
      cacheStatus: response.headers.get('x-vercel-cache'),
      looksLikeProvisioning: looksLikeProvisioningBody(body),
      preview: body.slice(0, 280),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Network test failed.' },
      { status: 500 }
    );
  }
}