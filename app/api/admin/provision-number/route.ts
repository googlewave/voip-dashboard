import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { sendPhoneProvisionedEmail } from '@/lib/email';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, areaCode, e911 } = await req.json();

    if (!userId || !areaCode) {
      return NextResponse.json(
        { error: 'userId and areaCode are required' },
        { status: 400 }
      );
    }

    const cleanAreaCode = areaCode.toString().trim();

    // 1. Search for available number
    const available = await twilioClient
      .availablePhoneNumbers('US')
      .local.list({ areaCode: cleanAreaCode, limit: 1 });

    if (available.length === 0) {
      return NextResponse.json(
        { error: `No available numbers for area code ${cleanAreaCode}` },
        { status: 404 }
      );
    }

    // 2. Purchase the number with voice webhook already set
    const voiceWebhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice`;
    const purchased = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      voiceUrl: voiceWebhookUrl,
      voiceMethod: 'POST',
    });

    // 3. Create E911 address and attach in two separate updates
    if (e911?.street && e911?.city && e911?.region && e911?.postalCode) {

      // Step A — create the address
      const address = await twilioClient.addresses.create({
        customerName: e911.customerName ?? 'Ring Ring Club User',
        street: e911.street,
        city: e911.city,
        region: e911.region,
        postalCode: e911.postalCode,
        isoCountry: e911.isoCountry ?? 'US',
        emergencyEnabled: true,
      });

      // Step B — attach address SID first
      await twilioClient.incomingPhoneNumbers(purchased.sid).update({
        emergencyAddressSid: address.sid,
      });

      // Step C — then set status in a separate request
      await twilioClient.incomingPhoneNumbers(purchased.sid).update({
        emergencyStatus: 'Active',
      });
    }

    // 4. Save to Prisma
    const user = await prisma.user.update({
      where: { id: userId },
      data: { twilioNumber: purchased.phoneNumber },
    });

    // 5. Send email notification
    try {
      await sendPhoneProvisionedEmail({
        to: user.email,
        name: e911?.customerName || user.email.split('@')[0],
        phoneNumber: purchased.phoneNumber,
      });
    } catch (emailErr: any) {
      console.error('Failed to send phone provisioned email:', emailErr.message);
    }

    return NextResponse.json({
      success: true,
      phoneNumber: purchased.phoneNumber,
    });

  } catch (err: any) {
    console.error('Provision number error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
