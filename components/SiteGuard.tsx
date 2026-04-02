'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const UNGUARDED = ['/gate', '/login', '/verify-2fa', '/landing', '/buy', '/invite'];

export default function SiteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isUnguarded = UNGUARDED.some((p) => pathname === p || pathname.startsWith(p + '/'));
    if (isUnguarded) return;

    const unlocked = localStorage.getItem('site_unlocked');
    if (!unlocked) { router.push('/gate'); return; }

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const alreadyVerified = sessionStorage.getItem(`2fa_verified_${user.id}`);
      if (alreadyVerified) return;

      const { data: profile } = await supabase
        .from('users')
        .select('two_factor_enabled')
        .eq('id', user.id)
        .single();

      if (profile?.two_factor_enabled) {
        router.push('/verify-2fa');
      }
    });
  }, [pathname, router]);

  return <>{children}</>;
}
