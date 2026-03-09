import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function isSipAddress(to: string) {
  return to.startsWith('sip:') || to.includes('@');
}

function isRingRingClubSip(to: string, sipDomain: string) {
  return to.includes(sipDomain);
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const to = formData.get('To')?.toString() || '';
  const from = formData.get('From')?.toString() || '';

  const sipDomain = process.env.TWILIO_SIP_DOMAIN!;

  const sipUsername = from.replace('sip:', '').split('@')[0];
  const device = await prisma.device.findFirst({
    where: { sipUsername },
  });

  const user = device
    ? await prisma.user.findUnique({ where: { id: device.userId } })
    : null;

  const plan = user?.plan || 'free';

  // FREE — SIP to SIP within Ring Ring Club
  if (isSipAddress(to) && isRingRingClubSip(to, sipDomain)) {
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
  if (!isSipAddress(to)) {
    if (plan !== 'paid') {
      if (user) {
        await prisma.callLog.create({
          data: {
            userId: user.id,
            fromSip: from,
            toAddress: to,
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

    const twilioNumber = user?.twilioNumber || '';

    if (user) {
      await prisma.callLog.create({
        data: {
          userId: user.id,
          fromSip: from,
          toAddress: to,
          callType: 'pstn',
          status: 'completed',
        },
      });
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${twilioNumber}">
    <Number>${to}</Number>
  </Dial>
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
