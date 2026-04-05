import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isSipAddress(to: string) {
  return to.startsWith('sip:') || to.includes('@');
}

function isRingRingClubSip(to: string, sipDomain: string) {
  return to.includes(sipDomain);
}

function extractUserPart(address: string) {
  return address.replace('sip:', '').split('@')[0] || '';
}

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

function normalizePstnDestination(rawTo: string) {
  const userPart = isSipAddress(rawTo) ? extractUserPart(rawTo) : rawTo;
  return normalizeToE164(userPart);
}

function normalizeStoredPhone(raw: string) {
  return normalizeToE164(raw);
}

function parseQuickDialSlot(input: string) {
  const digitsOnly = input.replace(/\D/g, '');
  if (digitsOnly.length !== 1) return null;
  const slot = Number(digitsOnly);
  return slot >= 1 && slot <= 9 ? slot : null;
}

async function resolveQuickDialContact(deviceId: string, userId: string, slot: number) {
  const contacts = await prisma.contact.findMany({
    where: {
      quickDialSlot: slot,
      OR: [{ deviceId }, { userId }],
    },
    select: {
      deviceId: true,
      phoneNumber: true,
      sipAddress: true,
    },
  });

  const deviceScoped = contacts.find((c) => c.deviceId === deviceId);
  return deviceScoped ?? contacts[0] ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const to = params.get('To') || '';
  const from = params.get('From') || '';

  const sipDomain = process.env.TWILIO_SIP_DOMAIN!;
  const toUserPart = extractUserPart(to);
  const isInternalSipTarget = toUserPart.startsWith('sip_');

  const sipUsername = from.replace('sip:', '').split('@')[0];
  const device = await prisma.device.findFirst({
    where: { sipUsername },
  });

  const user = device
    ? await prisma.user.findUnique({ where: { id: device.userId } })
    : null;

  const plan = user?.plan || 'free';
  const hasPstnPlan = plan === 'paid' || plan === 'monthly' || plan === 'annual';

  // FREE — SIP to SIP within Ring Ring Club
  if (isSipAddress(to) && isRingRingClubSip(to, sipDomain) && isInternalSipTarget) {
    const targetSip = to.startsWith('sip:') ? to : `sip:${to}`;

    if (user) {
      await prisma.callLog.create({
        data: {
          userId: user.id,
          fromSip: from,
          toAddress: to,
          callType: 'sip_to_sip',
          status: 'completed',
        },
      });
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>${targetSip}</Sip>
  </Dial>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // PSTN — real phone number
  if (!isInternalSipTarget) {
    let pstnTo = normalizePstnDestination(to);

    if (!pstnTo) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Invalid destination number.</Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (!device) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Device not found.</Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const quickDialSlot = parseQuickDialSlot(toUserPart);
    if (quickDialSlot) {
      const quickDialContact = await resolveQuickDialContact(device.id, device.userId, quickDialSlot);

      const normalizedQuickDialSip = quickDialContact?.sipAddress?.replace(/^sip:/, '') || '';
      if (normalizedQuickDialSip) {
        const targetSip = normalizedQuickDialSip.includes('@')
          ? `sip:${normalizedQuickDialSip}`
          : `sip:${normalizedQuickDialSip}@${sipDomain}`;

        if (user) {
          await prisma.callLog.create({
            data: {
              userId: user.id,
              fromSip: from,
              toAddress: targetSip,
              callType: 'sip_to_sip',
              status: 'completed',
            },
          });
        }

        return new NextResponse(
          `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial>
    <Sip>${targetSip}</Sip>
  </Dial>
</Response>`,
          { headers: { 'Content-Type': 'text/xml' } }
        );
      }

      if (quickDialContact?.phoneNumber) {
        pstnTo = normalizeStoredPhone(quickDialContact.phoneNumber);
      }
    }

    const approvedContacts = await prisma.contact.findMany({
      where: {
        OR: [{ deviceId: device.id }, { userId: device.userId }],
      },
      select: { phoneNumber: true },
    });

    const isWhitelisted = approvedContacts.some((contact) => {
      if (!contact.phoneNumber) return false;
      return normalizeStoredPhone(contact.phoneNumber) === pstnTo;
    });

    if (!isWhitelisted) {
      if (user) {
        await prisma.callLog.create({
          data: {
            userId: user.id,
            fromSip: from,
            toAddress: pstnTo,
            callType: 'pstn',
            status: 'blocked',
          },
        });
      }

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>This number is not approved for calling.</Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (!hasPstnPlan) {
      if (user) {
        await prisma.callLog.create({
          data: {
            userId: user.id,
            fromSip: from,
            toAddress: pstnTo,
            callType: 'pstn',
            status: 'blocked',
          },
        });
      }

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Calling phone numbers requires a Ring Ring Club paid plan. Please upgrade at ring ring club dot com.</Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const twilioNumber = user?.twilioNumber || process.env.TWILIO_PHONE_NUMBER || '';

    if (!twilioNumber) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Caller ID is not configured.</Say>
  <Hangup/>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    if (user) {
      await prisma.callLog.create({
        data: {
          userId: user.id,
          fromSip: from,
          toAddress: pstnTo,
          callType: 'pstn',
          status: 'completed',
        },
      });
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${twilioNumber}" answerOnBridge="true" timeout="25">
    <Number>${pstnTo}</Number>
  </Dial>
  <Say>We could not connect your call. Please try again.</Say>
  <Hangup/>
</Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // Fallback
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We could not complete your call. Please try again.</Say>
  <Hangup/>
</Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}
