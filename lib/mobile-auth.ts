import { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

export async function getMobileRequestUser(req: NextRequest): Promise<User | null> {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}
