import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-brand-400" />
        <p className="text-sm text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
