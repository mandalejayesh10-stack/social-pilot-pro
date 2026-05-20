'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { authApi, orgApi } from '@/lib/api';

const PUBLIC_PATHS = ['/login', '/register', '/legal'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setOrganizations, user, currentOrg, organizations } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    authApi
      .me()
      .then(async (me: any) => {
        setUser(me);
        // Attach orgs from the me response if available
        if (me.organizations?.length) {
          setOrganizations(me.organizations.map((o: any) => ({ ...o.organization, role: o.role })));
        } else {
          const orgs = await orgApi.list();
          setOrganizations(orgs);
        }
      })
      .catch(() => {
        if (!isPublic) router.push('/login');
      })
      .finally(() => setReady(true));
  }, []);

  // Don't flash content before auth check completes on protected routes
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (!ready && !isPublic) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center animate-pulse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-sm text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
