import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProviderForDevice } from '@/lib/voip';

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get('deviceId');
  if (!deviceId) return NextResponse.json({ error: 'deviceId required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: device } = await supabase
    .from('devices')
    .select('phone_number, voip_provider')
    .eq('id', deviceId)
    .single();

  if (!device?.phone_number) {
    return NextResponse.json({ logs: [] });
  }

  const provider = getProviderForDevice(device.voip_provider);
  const logs = await provider.getCallLogs(device.phone_number);

  return NextResponse.json({ logs });
}
