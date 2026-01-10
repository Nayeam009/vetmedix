import { Home, ShoppingBag, Stethoscope, User, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

const MobileNav = () => {
  const location = useLocation();
  const { totalItems } = useCart();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: Stethoscope, label: 'Clinics', path: '/clinics' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: totalItems },
    { icon: User, label: 'Account', path: '/auth' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
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