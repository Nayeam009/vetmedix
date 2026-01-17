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
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SheetClose } from '@/components/ui/sheet';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive' | 'outline';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
      { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    ]
  },
  {
    title: 'E-Commerce',
    items: [
      { icon: Package, label: 'Products', path: '/admin/products' },
      { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
    ]
  },
  {
    title: 'Platform',
    items: [
      { icon: Building2, label: 'Clinics', path: '/admin/clinics' },
      { icon: MessageSquare, label: 'Social', path: '/admin/social' },
      { icon: Users, label: 'Customers', path: '/admin/customers' },
    ]
  },
  {
    title: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ]
  },
];

interface AdminMobileNavProps {
  pendingOrders?: number;
  pendingVerifications?: number;
}

export const AdminMobileNav = ({ pendingOrders = 0, pendingVerifications = 0 }: AdminMobileNavProps) => {
  const location = useLocation();

  // Add badges dynamically
  const sectionsWithBadges = navSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.path === '/admin/orders' && pendingOrders > 0) {
        return { ...item, badge: pendingOrders, badgeVariant: 'destructive' as const };
      }
      if (item.path === '/admin/clinics' && pendingVerifications > 0) {
        return { ...item, badge: pendingVerifications, badgeVariant: 'default' as const };
      }
      return item;
    })
  }));

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Logo */}
      <div className="p-4 sm:p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <SheetClose asChild>
          <Link to="/admin" className="block">
            <Logo to="/admin" size="md" showText showSubtitle variant="admin" />
          </Link>
        </SheetClose>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {sectionsWithBadges.map((section, sectionIdx) => (
          <div key={section.title}>
            {sectionIdx > 0 && <Separator className="mb-3" />}
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/admin' && location.pathname.startsWith(item.path));
                
                return (
                  <SheetClose asChild key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge 
                          variant={item.badgeVariant || 'default'} 
                          className={cn(
                            "h-5 min-w-5 px-1.5 text-[10px] font-bold",
                            isActive && "bg-white/20 text-white"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 opacity-50",
                        isActive && "text-primary-foreground"
                      )} />
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to Site */}
      <div className="p-3 sm:p-4 border-t border-border/50 bg-muted/30">
        <SheetClose asChild>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="flex-1">Back to Site</span>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </Link>
        </SheetClose>
      </div>
    </div>
  );
};
