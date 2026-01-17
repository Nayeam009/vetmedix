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
  ChevronLeft,
  ChevronRight,
  Store,
  Stethoscope,
  Heart,
  PawPrint,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    title: 'Clinic Management',
    items: [
      { icon: Building2, label: 'Clinics', path: '/admin/clinics' },
    ]
  },
  {
    title: 'Social Platform',
    items: [
      { icon: MessageSquare, label: 'Posts & Content', path: '/admin/social' },
    ]
  },
  {
    title: 'Users',
    items: [
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

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingOrders?: number;
  pendingVerifications?: number;
}

export const AdminSidebar = ({ collapsed, onToggle, pendingOrders = 0, pendingVerifications = 0 }: AdminSidebarProps) => {
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
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 bg-background/95 backdrop-blur-xl border-r border-border/50 z-50 hidden lg:flex flex-col shadow-lg transition-all duration-300 overflow-hidden",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("p-3 xl:p-4 border-b border-border/50", collapsed ? "px-2" : "")}>
          <Link to="/admin" className="flex items-center gap-2 group">
            {collapsed ? (
              <Logo to="/admin" size="sm" showText={false} />
            ) : (
              <Logo to="/admin" size="sm" showText showSubtitle={false} variant="admin" />
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 overflow-y-auto p-3 space-y-4", collapsed && "p-2 space-y-2")}>
          {sectionsWithBadges.map((section, sectionIdx) => (
            <div key={section.title}>
              {!collapsed && sectionIdx > 0 && (
                <Separator className="mb-3" />
              )}
              {!collapsed && (
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70 px-3 mb-2">
                  {section.title}
                </p>
              )}
              {collapsed && sectionIdx > 0 && (
                <div className="h-px bg-border/50 my-2" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  
                  const navLink = (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-xl text-sm font-medium transition-all relative group",
                        collapsed ? "px-3 py-2.5 justify-center" : "px-3 py-2.5",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4.5 w-4.5 flex-shrink-0", collapsed ? "h-5 w-5" : "")} />
                      {!collapsed && (
                        <>
                          <span className="whitespace-nowrap flex-1">{item.label}</span>
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant={item.badgeVariant || 'default'} 
                              className={cn(
                                "h-5 min-w-5 px-1.5 text-[10px] font-bold",
                                isActive && item.badgeVariant === 'destructive' && "bg-white text-destructive",
                                isActive && item.badgeVariant !== 'destructive' && "bg-white/20 text-white"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                      {collapsed && item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>
                          {navLink}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium flex items-center gap-2">
                          {item.label}
                          {item.badge && item.badge > 0 && (
                            <Badge variant={item.badgeVariant || 'default'} className="h-5 text-[10px]">
                              {item.badge}
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return navLink;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className={cn(
              "w-full flex items-center gap-2 text-muted-foreground hover:text-foreground",
              collapsed ? "justify-center px-2" : "justify-start px-4"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>

        {/* Back to Site */}
        <div className={cn("p-3 border-t border-border/50", collapsed && "p-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Back to Site
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Site
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};
