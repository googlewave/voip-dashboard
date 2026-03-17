import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const device = await prisma.device.findFirst({ where: { id: deviceId, userId: user.id } });
  if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  if (!device.sipUsername || !device.sipPassword || !device.sipDomain) {
    return NextResponse.json({ error: 'No SIP credentials provisioned yet' }, { status: 400 });
  }

  const contacts = await prisma.contact.findMany({
    where: { deviceId },
    orderBy: { quickDialSlot: 'asc' },
    select: { name: true, phoneNumber: true, quickDialSlot: true },
  });

  const sipDomain = device.sipDomain.replace(/:(\d+)$/, '');
  const displayName = device.name ?? device.sipUsername;

  // Build outbound dial plan from approved contacts only
  // Each approved number becomes an allowed pattern e.g. 12125551234
  const approvedNumbers = contacts.map((c) =>
    c.phoneNumber.replace(/\D/g, '') // strip non-digits
  );

  // Dial plan: only allow calls to approved numbers + emergency services
  const approvedPatterns = approvedNumbers.map((n) => `${n}`).join('|');
  const dialPlan = approvedPatterns.length > 0
    ? `{ 911 | 933 | ${approvedPatterns} }`
    : `{ 911 | 933 }`;

  // Speed dial slots 1-9 — P71 is off-hook auto dial, speed dials use P301–P309
  const speedDialEntries = Array.from({ length: 9 }, (_, i) => {
    const slot = i + 1;
    const contact = contacts.find((c) => c.quickDialSlot === slot);
    const pCode = 300 + slot; // P301–P309 for HT801 speed dial
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

    <!-- Accept SIP from proxy only: blocks unsolicited inbound at device level -->
    <P258>1</P258>

    <!-- Codecs: G.711u, G.711a, G.729 -->
    <P57>0</P57>
    <P58>8</P58>
    <P59>18</P59>

    <!-- RTP Ports -->
    <P196>10000</P196>
    <P197>20000</P197>

    <!-- SIP
