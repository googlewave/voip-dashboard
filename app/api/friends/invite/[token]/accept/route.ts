import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();

    const { token: inviteToken } = await params;
    
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

    const { deviceIds } = await req.json();

    if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
      return NextResponse.json({ error: 'Must select at least one device' }, { status: 400 });
    }

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from('friend_invites')
      .select('*')
      .eq('invite_token', inviteToken)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
    }

    if (new Date() > new Date(invite.expires_at)) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    // Prevent self-friending
    if (invite.sender_user_id === user.id) {
      return NextResponse.json({ error: 'Cannot accept your own invite' }, { status: 400 });
    }

    // Create friendship (ensure userAId < userBId for uniqueness)
    const [userAId, userBId] = [invite.sender_user_id, user.id].sort();

    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user_a_id: userAId,
        user_b_id: userBId,
        created_from_invite_id: invite.id,
      })
      .select()
      .single();

    if (friendshipError) {
      console.error('Error creating friendship:', friendshipError);
      return NextResponse.json({ error: 'Failed to create friendship' }, { status: 500 });
    }

    // Add device permissions
    const devicePermissions = deviceIds.map((deviceId: string) => ({
      friendship_id: friendship.id,
      device_id: deviceId,
    }));

    const { error: permissionsError } = await supabase
      .from('friend_device_permissions')
      .insert(devicePermissions);

    if (permissionsError) {
      console.error('Error adding device permissions:', permissionsError);
      return NextResponse.json({ error: 'Failed to add device permissions' }, { status: 500 });
    }

    // Mark invite as accepted
    await supabase
      .from('friend_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user.id,
      })
      .eq('id', invite.id);

    return NextResponse.json({
      success: true,
      friendshipId: friendship.id,
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
