import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizeToE164(raw: string) {
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const From = (formData.get('From') as string) || '';
    const To = (formData.get('To') as string) || '';

    console.log(`📞 Call from ${From} to ${To}`);

    const normalizedFrom = normalizeToE164(From);
    const normalizedTo = normalizeToE164(To);

    const calledUser = await prisma.user.findFirst({
      where: { twilioNumber: normalizedTo },
      select: { id: true },
    });

    if (!calledUser) {
      console.error('No user found for called Twilio number:', normalizedTo);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This number is not configured for incoming calls.</Say>
  <Hangup/>
</Response>`;
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const approvedContacts = await prisma.contact.findMany({
      where: {
        userId: calledUser.id,
      },
      select: { phoneNumber: true },
    });

    const allowedIncoming = approvedContacts.some((contact) => {
      if (!contact.phoneNumber) return false;
      return normalizeToE164(contact.phoneNumber) === normalizedFrom;
    });

    if (!allowedIncoming) {
      console.log(`❌ Incoming call blocked (not safe-listed): ${normalizedFrom}`);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Reject reason="rejected" />
</Response>`;
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const targetDevice = await prisma.device.findFirst({
      where: {
        userId: calledUser.id,
        sipUsername: { not: null },
        isOnline: true,
      },
      select: { sipUsername: true },
      orderBy: { createdAt: 'asc' },
    });

    const fallbackDevice = targetDevice
      ? null
      : await prisma.device.findFirst({
          where: {
            userId: calledUser.id,
            sipUsername: { not: null },
          },
          select: { sipUsername: true },
          orderBy: { createdAt: 'asc' },
        });

    const sipUsername = targetDevice?.sipUsername || fallbackDevice?.sipUsername;

    if (!sipUsername) {
      console.error('No SIP-ready device found for user:', calledUser.id);
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>The called device is currently unavailable.</Say>
  <Hangup/>
</Response>`;
      return new NextResponse(twiml, {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    const sipDomain = process.env.TWILIO_SIP_DOMAIN || 'ringringclub.sip.twilio.com';
    const targetSip = `sip:${sipUsername}@${sipDomain}`;

    console.log(`✅ Incoming call allowed: ${normalizedFrom} -> ${targetSip}`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" timeout="30">
    <Sip>${targetSip}</Sip>
  </Dial>
  <Say>The called line is unavailable right now.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error: unknown) {
    console.error('Twilio webhook error:', error);
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>An error occurred. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
