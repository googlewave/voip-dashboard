import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, plan } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    // 👇 Log full error object to Vercel logs
    if (error) {
      console.error('Supabase createUser error:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `Supabase error: ${error.message} (status: ${error.status})` },
        { status: 400 }
      );
    }

    if (!data?.user) {
      return NextResponse.json({ error: 'No user returned from Supabase' }, { status: 500 });
    }

    // Create user record in Prisma
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        plan: plan ?? 'free',
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error('Create user route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
