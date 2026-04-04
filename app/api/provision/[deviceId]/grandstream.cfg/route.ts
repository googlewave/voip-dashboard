import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { escapeXml } from '@/lib/voip/xml';
import { ensureTwilioSetup, createSipCredentials } from '@/lib/twilio-setup';

export async function GET(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
    select: {
      id: true,
      sipUsername: true,
      sipPassword: true,
      sipDomain: true,
      name: true,
    },
  });

  if (!device) {
    return new NextResponse('Device not found or SIP not provisioned', { status: 404 });
  }

  await ensureTwilioSetup();

  if (!device.sipUsername || !device.sipPassword) {
    const username = `sip_${deviceId.slice(-6)}_${Date.now()}`;
    const password = Math.random().toString(36).slice(-12) + 'A1!';

    await createSipCredentials(username, password);

    await prisma.device.update({
      where: { id: deviceId },
      data: {
        sipUsername: username,
        sipPassword: password,
        sipDomain: process.env.TWILIO_SIP_DOMAIN,
      },
    });

    device.sipUsername = username;
    device.sipPassword = password;
    device.sipDomain = process.env.TWILIO_SIP_DOMAIN || null;
  }

  const contacts = await prisma.contact.findMany({
    where: { deviceId },
    orderBy: { quickDialSlot: 'asc' },
    select: { name: true, phoneNumber: true, quickDialSlot: true },
  });

  const sipDomain = (device.sipDomain ?? process.env.TWILIO_SIP_DOMAIN ?? 'ringringclub.sip.twilio.com').replace(/:(\d+)$/, '');
  const displayName = device.name ?? device.sipUsername;
  const escapedSipDomain = escapeXml(sipDomain);
  const escapedSipUsername = escapeXml(device.sipUsername);
  const escapedSipPassword = escapeXml(device.sipPassword);
  const escapedDisplayName = escapeXml(displayName);

  // Dial plan: permissive — call validation happens at Twilio webhook level
  // { x+ } allows any digit sequence; Twilio voice webhook enforces whitelist
  const dialPlan = `{ x+ }`;

  // Speed dial slots 1–9
  const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
    const slot = i + 1;
    const contact = contacts.find((c) => c.quickDialSlot === slot);
    const pCode = 300 + slot;
    return contact && contact.phoneNumber
      ? `    <P${pCode}>${escapeXml(contact.phoneNumber.replace(/\D/g, ''))}</P${pCode}>`
      : `    <P${pCode}></P${pCode}>`;
  }).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<gs_provision version="1">
  <config version="1">

    <!-- SIP Server -->
    <P47>${escapedSipDomain}</P47>
    <P48>5060</P48>

    <!-- SIP Credentials -->
    <P35>${escapedSipUsername}</P35>
    <P36>${escapedSipUsername}</P36>
    <P34>${escapedSipPassword}</P34>
    <P3>${escapedDisplayName}</P3>

    <!-- Registration -->
    <P271>1</P271>
    <P32>60</P32>

    <!-- NAT Traversal: Keep-Alive -->
    <P52>1</P52>
    <P1364>keepalive</P1364>
    <P76>20</P76>

    <!-- STUN -->
    <P47S>stun.l.google.com</P47S>
    <P48S>19302</P48S>
    <P51>1</P51>

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

    <!-- SIP Transport: TCP (more reliable through NAT/firewalls) -->
    <P1361>1</P1361>

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
