import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  ArrowLeft,
  BarChart3,
  Building2,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpeg';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: Users, label: 'Customers', path: '/admin/customers' },
  { icon: Building2, label: 'Clinics', path: '/admin/clinics' },
  { icon: MessageSquare, label: 'Social Media', path: '/admin/social' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export const AdminMobileNav = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
        <Link to="/admin" className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="PetConnect Admin" 
            className="h-11 w-11 rounded-xl object-cover shadow-md"
          />
          <div>
            <h1 className="font-display font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">PetConnect</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/admin' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-soft" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to Site */}
      <div className="p-4 border-t border-border">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Site
        </Link>
      </div>
    </div>
  );
};
