import { ReactNode, useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:pl-[68px]" : "lg:pl-64"
      )}>
        <AdminHeader title={title} subtitle={subtitle} onToggleSidebar={toggleSidebar} collapsed={collapsed} />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
