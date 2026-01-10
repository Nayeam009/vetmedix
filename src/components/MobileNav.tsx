import { Home, ShoppingBag, Stethoscope, User } from 'lucide-react';

const MobileNav = () => {
  const navItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: ShoppingBag, label: 'Shop', active: false },
    { icon: Stethoscope, label: 'Clinics', active: false },
    { icon: User, label: 'Account', active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              item.active ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
