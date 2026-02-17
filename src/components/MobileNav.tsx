import { forwardRef } from 'react';
import { Home, Search, MessageCircle, Bell, User, Shield, Stethoscope, Building2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { prefetchRoute } from '@/lib/imageUtils';

const MobileNav = forwardRef<HTMLElement, object>((_, ref) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useAdmin();
  const { isDoctor, isClinicOwner } = useUserRole();

  // Build nav items based on user role
  const getNavItems = () => {
    const baseItems = [
      { icon: Home, label: 'Home', path: '/', badge: 0 },
      { icon: Search, label: 'Explore', path: '/explore', badge: 0 },
      { icon: MessageCircle, label: 'Messages', path: '/messages', badge: 0 },
      { icon: Bell, label: 'Alerts', path: '/notifications', badge: unreadCount },
    ];

    // Add role-specific dashboard as 5th item
    if (isAdmin) {
      return [...baseItems, { icon: Shield, label: 'Dashboard', path: '/admin', badge: 0 }];
    }
    if (isDoctor) {
      return [...baseItems, { icon: Stethoscope, label: 'Dashboard', path: '/doctor/dashboard', badge: 0 }];
    }
    if (isClinicOwner) {
      return [...baseItems, { icon: Building2, label: 'Dashboard', path: '/clinic/dashboard', badge: 0 }];
    }
    
    // Default: Dashboard/Login for regular users
    return [...baseItems, { icon: User, label: user ? 'Dashboard' : 'Login', path: user ? '/profile' : '/auth', badge: 0 }];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/') || 
           (path === '/doctor/dashboard' && location.pathname.startsWith('/doctor')) ||
           (path === '/clinic/dashboard' && location.pathname.startsWith('/clinic'));
  };

  return (
    <nav ref={ref} className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-14 sm:h-16 max-w-lg mx-auto">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <Link
              key={index}
              to={item.path}
              onTouchStart={() => prefetchRoute(item.path)}
              aria-label={item.badge > 0 ? `${item.label}, ${item.badge} unread` : item.label}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors active:scale-95 active:bg-primary/10 rounded-lg ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 sm:w-8 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

MobileNav.displayName = 'MobileNav';

export default MobileNav;
