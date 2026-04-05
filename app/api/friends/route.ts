import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

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

    // Get pending invites sent by user
    const { data: sentInvites } = await supabase
      .from('friend_invites')
      .select('*')
      .eq('sender_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    // Get friendships where user is either userA or userB
    const { data: friendships } = await supabase
      .from('friendships')
      .select(`
        *,
        devicePermissions:friend_device_permissions(*)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    // Get friend user details and their devices
    const friendUserIds = friendships?.map(f => 
      f.user_a_id === user.id ? f.user_b_id : f.user_a_id
    ) || [];

    const { data: friendUsers } = await supabase
      .from('users')
      .select('id, email')
      .in('id', friendUserIds);

    // Get devices for all friends
    const { data: friendDevices } = await supabase
      .from('devices')
      .select('id, user_id, name, sip_username, status')
      .in('user_id', friendUserIds);

    // Combine data
    const friendshipsWithDetails = friendships?.map(friendship => {
      const friendUserId = friendship.user_a_id === user.id ? friendship.user_b_id : friendship.user_a_id;
      const friendUser = friendUsers?.find(u => u.id === friendUserId);
      const devices = friendDevices?.filter(d => d.user_id === friendUserId) || [];
      
      // Filter devices to only those with permissions
      const permittedDeviceIds = friendship.devicePermissions?.map((p: any) => p.device_id) || [];
      const permittedDevices = devices.filter(d => permittedDeviceIds.includes(d.id));

      return {
        ...friendship,
        friendEmail: friendUser?.email,
        friendDevices: permittedDevices,
      };
    }) || [];

    return NextResponse.json({
      sentInvites: sentInvites || [],
      friendships: friendshipsWithDetails,
    });
  } catch (error: any) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
