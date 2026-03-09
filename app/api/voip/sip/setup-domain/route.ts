import { NextResponse } from 'next/server';
import { twilioClient } from '@/lib/twilio';
import { getUser } from '@/lib/auth';

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const domains = await twilioClient.sip.domains.list();
    const existing = domains.find((d) => d.domainName === process.env.TWILIO_SIP_DOMAIN);
    if (existing) {
      return NextResponse.json({ message: 'Domain already exists', domain: existing });
    }

    const domain = await twilioClient.sip.domains.create({
      domainName: process.env.TWILIO_SIP_DOMAIN!,
      friendlyName: 'Ring Ring Club',
      sipRegistration: true,
    });

    return NextResponse.json({ success: true, domain });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
