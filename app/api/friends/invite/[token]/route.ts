import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { data: invite, error } = await supabase
      .from('friend_invites')
      .select('*, sender:sender_user_id(email)')
      .eq('invite_token', token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
    }

    if (new Date() > new Date(invite.expires_at)) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    return NextResponse.json({
      senderEmail: invite.sender?.email || 'Unknown',
      expiresAt: invite.expires_at,
    });
  } catch (error: any) {
    console.error('Error fetching invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
