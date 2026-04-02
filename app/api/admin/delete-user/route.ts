import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // 0. Release Twilio phone number so we stop being billed for it
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: { twilioNumberSid: true, twilioNumber: true },
    });
    if (userData?.twilioNumberSid) {
      try {
        const twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID!,
          process.env.TWILIO_AUTH_TOKEN!
        );
        await twilioClient.incomingPhoneNumbers(userData.twilioNumberSid).remove();
        console.log(`Released Twilio number ${userData.twilioNumber} (${userData.twilioNumberSid})`);
      } catch (twilioErr: any) {
        // Log but don't block deletion — number may already be released
        console.error('Failed to release Twilio number:', twilioErr.message);
      }
    }

    // 1. Delete contacts
    await prisma.contact.deleteMany({ where: { userId } });

    // 2. Clean up per-device records then delete devices
    const userDevices = await prisma.device.findMany({ where: { userId }, select: { id: true } });
    for (const device of userDevices) {
      await prisma.sipCredential.deleteMany({ where: { deviceId: device.id } });
      await prisma.provisioningLog.deleteMany({ where: { deviceId: device.id } });
    }
    await prisma.device.deleteMany({ where: { userId } });

    // 3. Delete the user row
    await prisma.user.deleteMany({ where: { id: userId } });

    // 4. Delete from Supabase Auth
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Supabase auth delete error:', authError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message ?? 'Failed to delete user' }, { status: 500 });
  }
}
