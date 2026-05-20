'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error mb-4">
        <AlertCircle size={24} />
      </div>
      <h2 className="text-base font-semibold text-text-primary mb-2">Something went wrong</h2>
      <p className="text-sm text-text-muted mb-6 max-w-sm">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <Button icon={<RefreshCw size={14} />} onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
