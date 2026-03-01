import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProviderForDevice } from '@/lib/voip';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const to = formData.get('To') as string;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: device } = await supabase
    .from('devices')
    .select('id, status, voip_provider')
    .eq('phone_number', to)
    .single();

  if (!device || !device.status) {
    return new NextResponse(
      '<Response><Say>This device is currently offline.</Say><Hangup/></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('device_id', device.id)
    .eq('phone', from)
    .single();

  if (!contact) {
    return new NextResponse(
      '<Response><Say>You are not an approved contact for this device.</Say><Hangup/></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  const provider = getProviderForDevice(device.voip_provider);
  const xml = await provider.handleInboundCall(from, to);

  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}
