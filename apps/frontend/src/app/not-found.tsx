import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 mx-auto mb-6">
          <Zap size={28} />
        </div>
        <h1 className="text-6xl font-bold text-brand-500 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Page not found</h2>
        <p className="text-sm text-text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button icon={<Home size={15} />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
