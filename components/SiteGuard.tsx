'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SiteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/gate') return;
    const unlocked = localStorage.getItem('site_unlocked');
    if (!unlocked) router.push('/gate');
  }, [pathname]);

  return <>{children}</>;
}
