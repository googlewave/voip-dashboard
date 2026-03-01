import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProviderForDevice } from '@/lib/voip';

export async function POST(req: NextRequest) {
  const { deviceId, areaCode } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: device } = await supabase
    .from('devices')
    .select('voip_provider')
    .eq('id', deviceId)
    .single();

  const provider = getProviderForDevice(device?.voip_provider || 'twilio');
  const phoneNumber = await provider.provisionNumber(deviceId, areaCode);

  await supabase
    .from('devices')
    .update({ phone_number: phoneNumber })
    .eq('id', deviceId);

  return NextResponse.json({ phoneNumber });
}
