import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { escapeXml } from '@/lib/voip/xml';
import { getProvisioningFamily, getProvisioningQueryType } from '@/lib/voip/adapters';

const DEFAULT_PROVISION_INTERVAL_MINUTES = 5;

function getProvisionIntervalMinutes() {
  const raw = process.env.HT801_PROVISION_INTERVAL_MINUTES;
  const parsed = raw ? Number(raw) : DEFAULT_PROVISION_INTERVAL_MINUTES;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_PROVISION_INTERVAL_MINUTES;
}

type GrandstreamProvisionDevice = {
  id: string;
  userId: string;
  name: string;
  sipUsername: string | null;
  sipPassword: string | null;
  sipDomain: string | null;
  macAddress: string | null;
  adapterType: string | null;
};

type ProvisionContact = {
  quickDialSlot: number | null;
  phoneNumber: string | null;
  sipAddress: string | null;
};

function normalizePhoneNumber(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

function generateGrandstreamConfig(device: GrandstreamProvisionDevice, contacts: ProvisionContact[]) {
  const sipDomain = device.sipDomain ?? 'ringringclub.sip.twilio.com';
  const provisionIntervalMinutes = getProvisionIntervalMinutes();
  const escapedMacAddress = escapeXml(device.macAddress?.replace(/:/g, '').toLowerCase());
  const escapedSipDomain = escapeXml(sipDomain);
  const escapedSipUsername = escapeXml(device.sipUsername);
  const escapedSipPassword = escapeXml(device.sipPassword);
  const escapedDeviceName = escapeXml(device.name);
  const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
    const slot = i + 1;
    const pCode = 300 + slot;
    const contact = contacts.find((c) => c.quickDialSlot === slot);

    if (!contact) {
      return `    <P${pCode}></P${pCode}>`;
    }

    const normalizedSip = contact.sipAddress?.replace(/^sip:/, '') || '';
    if (normalizedSip) {
      return `    <P${pCode}>${escapeXml(normalizedSip)}</P${pCode}>`;
    }

    if (contact.phoneNumber) {
      return `    <P${pCode}>${escapeXml(normalizePhoneNumber(contact.phoneNumber))}</P${pCode}>`;
    }

    return `    <P${pCode}></P${pCode}>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
  <mac>${escapedMacAddress}</mac>
  <config version="1">

    <!-- SIP Server -->
    <P47>${escapedSipDomain}</P47>
    <P48></P48>

    <!-- SIP Credentials -->
    <P35>${escapedSipUsername}</P35>
    <P36>${escapedSipUsername}</P36>
    <P34>${escapedSipPassword}</P34>
    <P3>${escapedDeviceName}</P3>

    <!-- Account Active + Registration -->
    <P271>1</P271>
    <P32>60</P32>

    <!-- NAT Traversal: Keep-Alive (P52=2) -->
    <P52>2</P52>
    <P76>20</P76>

    <!-- SIP Transport: TCP (P130=1) -->
    <P130>1</P130>

    <!-- DNS Mode: NAPTR/SRV (P37=2) -->
    <P37>2</P37>

    <!-- Auto Provision Check Interval (minutes) -->
    <P193>${provisionIntervalMinutes}</P193>

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

    <!-- Speed Dial Slots 1-9 -->
${speedDialEntries}

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
  const mac = rawParam
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

  try {
    // Look up device by normalized MAC (strip separators, lowercase)
    const devices = await prisma.$queryRaw<GrandstreamProvisionDevice[]>`
      SELECT
        id,
        user_id AS "userId",
        name,
        sip_username AS "sipUsername",
        sip_password AS "sipPassword",
        sip_domain AS "sipDomain",
        mac_address AS "macAddress",
        adapter_type AS "adapterType"
      FROM devices
      WHERE LOWER(REPLACE(mac_address, ':', '')) = ${mac}
      LIMIT 1
    `;

    const device = devices[0];

    if (!device) {
      console.log(`⚠️ MAC provisioning: No device found for MAC ${formattedMac}`);
      return NextResponse.json(
        { error: `No device registered for MAC ${formattedMac}` },
        { status: 404 }
      );
    }

    // Generate config directly (faster than internal fetch)
    const provisioningFamily = getProvisioningFamily(device.adapterType);
    const provisioningQueryType = getProvisioningQueryType(device.adapterType);
    console.log(`📡 MAC provisioning: ${formattedMac} → device ${device.id} (${device.name})`);

    // Generate Grandstream config directly
    if (provisioningFamily === 'grandstream') {
      const contacts: ProvisionContact[] = await prisma.contact.findMany({
        where: {
          OR: [{ deviceId: device.id }, { userId: device.userId }],
          quickDialSlot: { not: null },
        },
        orderBy: { quickDialSlot: 'asc' },
        select: {
          quickDialSlot: true,
          phoneNumber: true,
          sipAddress: true,
        },
      });

      const config = generateGrandstreamConfig(device, contacts);
      return new NextResponse(config, {
        headers: {
          'Content-Type': 'text/xml',
          'Cache-Control': 'public, max-age=300', // 5 minutes
        },
      });
    }

    // Fallback to internal fetch for other device types
    const provisionUrl = new URL(
      `/api/provision/auto/${device.id}?type=${provisioningQueryType}`,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ MAC provisioning error:', message);
    return NextResponse.json(
      { error: 'Provisioning failed' },
      { status: 500 }
    );
  }
}
