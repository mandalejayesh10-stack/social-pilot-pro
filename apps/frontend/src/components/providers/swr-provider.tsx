'use client';

import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        shouldRetryOnError: false,
        dedupingInterval: 5000,
        onError: (error) => {
          if (error?.status === 401) {
            // AuthProvider handles redirect
            return;
          }
          console.error('SWR error:', error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
