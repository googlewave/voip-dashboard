import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { corsPreflight, jsonWithCors } from '@/lib/api-cors';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Get user from session
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonWithCors({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return jsonWithCors({ error: 'Unauthorized' }, { status: 401 });
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
      return jsonWithCors({ error: 'Failed to create invite' }, { status: 500 });
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${inviteToken}`;

    return jsonWithCors({
      inviteToken,
      inviteUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in create invite:', error);
    return jsonWithCors({ error: error.message }, { status: 500 });
  }
}
