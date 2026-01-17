import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, User, LogOut, Home, PanelLeft, ShoppingCart, Building2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminMobileNav } from './AdminMobileNav';
import logo from '@/assets/logo.jpeg';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onToggleSidebar?: () => void;
  collapsed?: boolean;
  pendingOrders?: number;
  pendingVerifications?: number;
}

export const AdminHeader = ({ 
  title, 
  subtitle, 
  onToggleSidebar, 
  collapsed,
  pendingOrders = 0,
  pendingVerifications = 0
}: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const totalPending = pendingOrders + pendingVerifications;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast.success('Data refreshed');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px]">
              <AdminMobileNav />
            </SheetContent>
          </Sheet>

          {/* Desktop Toggle Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onToggleSidebar}
                  className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Logo - Mobile Only */}
          <Link to="/admin" className="lg:hidden flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={logo} 
                alt="VET-MEDIX Admin" 
                className="relative h-9 w-9 rounded-xl object-cover shadow-md border-2 border-primary/20 group-hover:border-primary/50 transition-all"
              />
            </div>
            <span className="font-display font-bold text-sm sm:text-base bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden xs:inline">Admin</span>
          </Link>

          {/* Page Title - Desktop */}
          <div className="hidden lg:block">
            <h1 className="text-lg xl:text-xl font-display font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-xs xl:text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Page Title - Mobile */}
        <div className="lg:hidden flex-1 text-center">
          <h1 className="text-sm sm:text-base font-display font-bold text-foreground truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
          {/* Search */}
          <div className="hidden lg:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-4 rounded-full bg-muted/50 hover:bg-muted/70 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm w-48 xl:w-64 transition-all"
            />
          </div>

          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRefresh}
                  className="hidden sm:flex h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh data</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notifications with Pending Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {totalPending > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {totalPending > 9 ? '9+' : totalPending}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Pending Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {pendingOrders > 0 && (
                <DropdownMenuItem onClick={() => navigate('/admin/orders?status=pending')} className="cursor-pointer py-3">
                  <ShoppingCart className="h-4 w-4 mr-3 text-amber-500" />
                  <span className="flex-1">{pendingOrders} pending order{pendingOrders !== 1 ? 's' : ''}</span>
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    Action
                  </Badge>
                </DropdownMenuItem>
              )}
              {pendingVerifications > 0 && (
                <DropdownMenuItem onClick={() => navigate('/admin/clinics?filter=pending')} className="cursor-pointer py-3">
                  <Building2 className="h-4 w-4 mr-3 text-blue-500" />
                  <span className="flex-1">{pendingVerifications} verification{pendingVerifications !== 1 ? 's' : ''}</span>
                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                    Review
                  </Badge>
                </DropdownMenuItem>
              )}
              {totalPending === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>All caught up! No pending actions.</p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Back to Site - Desktop */}
          <Button variant="ghost" size="sm" className="hidden xl:flex gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              <span>Site</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>Admin Account</span>
                  <span className="text-xs font-normal text-muted-foreground truncate">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Site
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
