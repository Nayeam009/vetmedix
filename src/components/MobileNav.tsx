import { Home, Search, MessageCircle, Bell, User, Shield, Stethoscope, Building2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';

const MobileNav = () => {
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
      return [...baseItems, { icon: Shield, label: 'Admin', path: '/admin', badge: 0 }];
    }
    if (isDoctor) {
      return [...baseItems, { icon: Stethoscope, label: 'Dashboard', path: '/doctor/dashboard', badge: 0 }];
    }
    if (isClinicOwner) {
      return [...baseItems, { icon: Building2, label: 'Clinic', path: '/clinic/dashboard', badge: 0 }];
    }
    
    // Default: Profile/Login for regular users
    return [...baseItems, { icon: User, label: user ? 'Profile' : 'Login', path: user ? '/profile' : '/auth', badge: 0 }];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/') || 
           (path === '/doctor/dashboard' && location.pathname.startsWith('/doctor')) ||
           (path === '/clinic/dashboard' && location.pathname.startsWith('/clinic'));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          return (
            <Link
              key={index}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
