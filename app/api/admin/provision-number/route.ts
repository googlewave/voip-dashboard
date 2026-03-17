import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, areaCode, e911 } = await req.json();

    // e911 shape:
    // {
    //   customerName: 'John Smith',
    //   street: '123 Main St',
    //   city: 'Philadelphia',
    //   region: 'PA',       // 2-letter state code
    //   postalCode: '19103',
    //   isoCountry: 'US',
    // }

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

    // 2. Create E911 address (if provided)
    let emergencyAddressSid: string | undefined;

    if (e911?.street && e911?.city && e911?.region && e911?.postalCode) {
      const address = await twilioClient.addresses.create({
        customerName: e911.customerName ?? 'Ring Ring Club User',
        street: e911.street,
        city: e911.city,
        region: e911.region,
        postalCode: e911.postalCode,
        isoCountry: e911.isoCountry ?? 'US',
        emergencyEnabled: true,
      });
      emergencyAddressSid = address.sid;
    }

    // 3. Purchase the number, attach E911 address if created
    const purchased = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      ...(emergencyAddressSid && {
        emergencyAddressSid,
        emergencyStatus: 'Active',
      }),
    });

    // 4. Save to Prisma
    await prisma.user.update({
      where: { id: userId },
      data: { twilioNumber: purchased.phoneNumber },
    });

    return NextResponse.json({
      success: true,
      phoneNumber: purchased.phoneNumber,
      emergencyAddressSid: emergencyAddressSid ?? null,
      emergencyStatus: emergencyAddressSid ? 'registered' : 'none',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
