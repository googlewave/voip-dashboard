import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { deviceId, newProvider, reason = 'auto' } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: current } = await supabase
    .from('devices')
    .select('voip_provider, user_id')
    .eq('id', deviceId)
    .single();

  await supabase
    .from('devices')
    .update({ voip_provider: newProvider })
    .eq('id', deviceId);

  await supabase
    .from('device_provider_history')
    .insert({
      device_id: deviceId,
      user_id: current?.user_id,
      previous_provider: current?.voip_provider || null,
      new_provider: newProvider,
      reason,
    });

  return NextResponse.json({ success: true });
}
