import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
