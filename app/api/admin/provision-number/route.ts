import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

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
    const { userId, areaCode } = await req.json();

    if (!userId || !areaCode) {
      return NextResponse.json({ error: 'userId and areaCode are required' }, { status: 400 });
    }

    const cleanAreaCode = areaCode.toString().trim();

    // Search for an available number in that area code
    const available = await twilioClient
      .availablePhoneNumbers('US')
      .local.list({ areaCode: cleanAreaCode, limit: 1 });

    if (available.length === 0) {
      return NextResponse.json(
        { error: `No available numbers found for area code ${cleanAreaCode}` },
        { status: 404 }
      );
    }

    // Purchase the number
    const purchased = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
    });

    // Save to Supabase
    const { error: dbError } = await supabase
      .from('users')
      .update({ twilio_number: purchased.phoneNumber })
      .eq('id', userId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, phoneNumber: purchased.phoneNumber });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
