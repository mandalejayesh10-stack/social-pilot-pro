import { Sidebar } from '@/components/layout/sidebar';
import { DashboardTopbar } from '@/components/layout/dashboard-topbar';
import { AuthProvider } from '@/components/providers/auth-provider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DashboardTopbar />
          <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
