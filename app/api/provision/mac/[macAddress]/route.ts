import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function generateGrandstreamConfig(device: any) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
  <config version="1">

    <!-- SIP Server -->
    <P47>ringringclub.sip.twilio.com</P47>
    <P48>5060</P48>

    <!-- SIP Credentials -->
    <P35>${device.sipUsername}</P35>
    <P36>${device.sipUsername}</P36>
    <P34>${device.sipPassword}</P34>
    <P3>${device.name}</P3>

    <!-- Account Active + Registration -->
    <P271>1</P271>
    <P32>60</P32>

    <!-- NAT Traversal: Keep-Alive (P52=2) -->
    <P52>2</P52>
    <P76>20</P76>

    <!-- SIP Transport: TCP (P130=1) -->
    <P130>1</P130>

    <!-- Audio Codecs: G.711u, G.711a, G.729 -->
    <P57>0</P57>
    <P58>8</P58>
    <P59>18</P59>

    <!-- Dial Plan: permissive (validation done at Twilio webhook) -->
    <P278>{ x+ }</P278>

    <!-- Outgoing Prefix: + required by Twilio for E.164 -->
    <P331>+</P331>

    <!-- Accept SIP from proxy only -->
    <P258>1</P258>

    <!-- SRTP: Disabled (Twilio SIP domains use RTP) -->
    <P183>0</P183>

  </config>
</gs_provision>`;
}

/**
 * MAC-based provisioning endpoint for zero-touch Grandstream provisioning.
 * 
 * Grandstream HT801 devices request configs as: cfg<MAC>.xml
 * This endpoint maps MAC address → device → generates config.
 * 
 * Config Server Path on HT801: https://voip-dashboard-sigma.vercel.app/api/provision/mac/
 * The device will request: /api/provision/mac/cfg<MAC>.xml
 * We extract the MAC and look up the device.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ macAddress: string }> }
) {
  const { macAddress: rawParam } = await params;

  // Extract MAC from various formats:
  // - cfgc074ad123456.xml (Grandstream auto-format)
  // - cfg<MAC> (no extension)
  // - C0:74:AD:12:34:56 (colon-separated)
  // - c074ad123456 (raw hex)
  let mac = rawParam
    .toLowerCase()
    .replace(/^cfg/, '')       // strip "cfg" prefix
    .replace(/\.xml$/, '')     // strip ".xml" suffix
    .replace(/[^a-f0-9]/g, ''); // strip colons, dashes, etc.

  if (mac.length !== 12) {
    return NextResponse.json(
      { error: 'Invalid MAC address format. Expected 12 hex characters.' },
      { status: 400 }
    );
  }

  // Format as colon-separated for DB lookup (stored as AA:BB:CC:DD:EE:FF)
  const formattedMac = mac.match(/.{2}/g)!.join(':').toUpperCase();
  // Also try lowercase version
  const formattedMacLower = formattedMac.toLowerCase();

  try {
    // Look up device by MAC address
    const device = await prisma.device.findFirst({
      where: {
        OR: [
          { macAddress: formattedMac },
          { macAddress: formattedMacLower },
          { macAddress: mac }, // raw hex
        ],
      },
    });

    if (!device) {
      console.log(`⚠️ MAC provisioning: No device found for MAC ${formattedMac}`);
      return NextResponse.json(
        { error: `No device registered for MAC ${formattedMac}` },
        { status: 404 }
      );
    }

    // Generate config directly (faster than internal fetch)
    const deviceType = device.adapterType || 'grandstream';
    console.log(`📡 MAC provisioning: ${formattedMac} → device ${device.id} (${device.name})`);

    // Generate Grandstream config directly
    if (deviceType === 'grandstream') {
      const config = generateGrandstreamConfig(device);
      return new NextResponse(config, {
        headers: {
          'Content-Type': 'text/xml',
          'Cache-Control': 'public, max-age=300', // 5 minutes
        },
      });
    }

    // Fallback to internal fetch for other device types
    const provisionUrl = new URL(
      `/api/provision/auto/${device.id}?type=${deviceType}`,
      req.nextUrl.origin
    );
    const configResponse = await fetch(provisionUrl.toString());
    const configBody = await configResponse.text();

    return new NextResponse(configBody, {
      status: configResponse.status,
      headers: {
        'Content-Type': configResponse.headers.get('Content-Type') || 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('❌ MAC provisioning error:', error.message);
    return NextResponse.json(
      { error: 'Provisioning failed' },
      { status: 500 }
    );
  }
}
