import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(_n: string, _v: string, _o: CookieOptions) {},
        remove(_n: string, _o: CookieOptions) {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { otp } = await req.json() as { otp: string };
  if (!otp) return NextResponse.json({ error: 'Missing OTP' }, { status: 400 });

  const { data: profile } = await supabase
    .from('users')
    .select('two_factor_otp, two_factor_otp_expires_at')
    .eq('id', user.id)
    .single();

  if (!profile?.two_factor_otp) {
    return NextResponse.json({ error: 'No OTP found' }, { status: 400 });
  }

  if (profile.two_factor_otp !== otp) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  if (new Date(profile.two_factor_otp_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code expired' }, { status: 400 });
  }

  await supabase
    .from('users')
    .update({ two_factor_otp: null, two_factor_otp_expires_at: null })
    .eq('id', user.id);

  return NextResponse.json({ verified: true });
}
