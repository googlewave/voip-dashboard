import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: {
      sipUsername: true,
      sipPassword: true,
      sipDomain: true,
      name: true,
    },
  });

  if (!device?.sipUsername || !device?.sipPassword || !device?.sipDomain) {
    return new NextResponse('Device not found or SIP not provisioned', { status: 404 });
  }

  const contacts = await prisma.contact.findMany({
    where: { deviceId },
    orderBy: { quickDialSlot: 'asc' },
    select: { name: true, phoneNumber: true, quickDialSlot: true },
  });

  const sipDomain = device.sipDomain.replace(/:(\d+)$/, '');
  const displayName = device.name ?? device.sipUsername;

  // Outbound dial plan: approved numbers + emergency only
  const approvedNumbers = contacts.map((c) => c.phoneNumber.replace(/\D/g, ''));
  const dialPlan = approvedNumbers.length > 0
    ? `{ 911 | 933 | ${approvedNumbers.join(' | ')} }`
    : `{ 911 | 933 }`;

  // Speed dial slots 1–9
  const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
    const slot = i + 1;
    const contact = contacts.find((c) => c.quickDialSlot === slot);
    const pCode = 300 + slot;
    return contact
      ? `    <P${pCode}>${contact.phoneNumber.replace(/\D/g, '')}</P${pCode}>`
      : `    <P${pCode}></P${pCode}>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
  <config version="1">

    <!-- SIP Server -->
    <P47>${sipDomain}</P47>
    <P48>5060</P48>

    <!-- SIP Credentials -->
    <P35>${device.sipUsername}</P35>
    <P36>${device.sipUsername}</P36>
    <P34>${device.sipPassword}</P34>
    <P3>${displayName}</P3>

    <!-- Registration -->
    <P271>1</P271>
    <P32>60</P32>

    <!-- NAT -->
    <P52>0</P52>
    <P1364>keepalive</P1364>
    <P76>20</P76>

    <!-- Dial Plan: approved contacts + emergency only -->
    <P278>${dialPlan}</P278>

    <!-- Dial Plan Prefix: required by Twilio -->
    <P331>+</P331>

    <!-- Accept SIP from proxy only -->
    <P258>1</P258>

    <!-- Codecs: G.711u, G.711a, G.729 -->
    <P57>0</P57>
    <P58>8</P58>
    <P59>18</P59>

    <!-- RTP Ports -->
    <P196>10000</P196>
    <P197>20000</P197>

    <!-- SIP Transport: UDP -->
    <P1361>0</P1361>

    <!-- SRTP: Disabled -->
    <P183>0</P183>

    <!-- Speed Dial Slots 1-9 -->
${speedDialEntries}

    <!-- Disable auto-provisioning -->
    <P194>0</P194>
    <P238>2</P238>

  </config>
</gs_provision>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/xml',
      'Content-Disposition': `attachment; filename="grandstream.cfg"`,
    },
  });
}
