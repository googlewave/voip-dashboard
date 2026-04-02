import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite in database
    const { data: invite, error: createError } = await supabase
      .from('friend_invites')
      .insert({
        sender_user_id: user.id,
        invite_token: inviteToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invite:', createError);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${inviteToken}`;

    return NextResponse.json({
      inviteToken,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in create invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
