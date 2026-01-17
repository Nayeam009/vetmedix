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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.jpeg';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-background/95 backdrop-blur-xl border-r border-border/50 z-50 hidden lg:flex flex-col shadow-lg transition-all duration-300",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn("p-4 border-b border-border/50", collapsed ? "px-3" : "xl:p-6")}>
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={logo} 
                alt="VET-MEDIX Admin" 
                className="relative h-10 w-10 rounded-xl object-cover shadow-md border-2 border-primary/20 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300"
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-foreground text-sm xl:text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent whitespace-nowrap">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">VET-MEDIX</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 p-4 space-y-1", collapsed && "p-2")}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            const navLink = (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
                  collapsed ? "px-3 py-3 justify-center" : "px-4 py-3",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-soft" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    {navLink}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navLink;
          })}
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
        <div className={cn("p-4 border-t border-border/50", collapsed && "p-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
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
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
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
