import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Home, Store, Stethoscope, PawPrint, Compass, MessageCircle, Shield, Building2, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { PetSwitcher } from '@/components/social/PetSwitcher';
import { NotificationBell } from '@/components/social/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import logo from '@/assets/logo.jpeg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isAdmin } = useAdmin();
  const { isDoctor, isClinicOwner } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navLinks = [
    { path: '/feed', label: 'Feed', icon: Home },
    { path: '/explore', label: 'Explore', icon: Compass },
    { path: '/shop', label: 'Shop', icon: Store },
    { path: '/clinics', label: 'Clinics', icon: Stethoscope },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={logo} 
                alt="VET-MEDIX Logo" 
                className="relative h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 rounded-xl object-cover shadow-md border-2 border-primary/20 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300"
              />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-lg lg:text-xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                VET-MEDIX
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium tracking-wide hidden sm:block">
                Social • Shop • Care
              </p>
            </div>
          </Link>

          {/* Center Search Bar - Desktop/Tablet */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-4 lg:mx-8">
            <div className={`relative w-full transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-md transition-opacity duration-300 ${isSearchFocused ? 'opacity-100' : 'opacity-0'}`} />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <input
                type="text"
                placeholder="Search pets, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="relative w-full h-10 lg:h-11 pl-11 pr-4 rounded-full bg-muted/50 hover:bg-muted/70 border border-border/50 focus:border-primary/50 focus:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm placeholder:text-muted-foreground/70"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link key={link.path} to={link.path}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`gap-2 font-medium transition-all duration-200 ${
                      active 
                        ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tablet Navigation - Compact */}
            <div className="hidden md:flex lg:hidden items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    <Menu className="h-4 w-4" />
                    <span className="text-sm">Menu</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <DropdownMenuItem key={link.path} asChild>
                        <Link to={link.path} className="flex items-center gap-3 cursor-pointer">
                          <Icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-border/50 mx-1" />

            {/* Messages */}
            {user && (
              <Link to="/messages" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <MessageCircle className="h-[18px] w-[18px]" />
                </Button>
              </Link>
            )}

            {/* Notifications */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 text-muted-foreground hover:text-foreground" 
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm animate-in zoom-in-50 duration-200">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Button>

            {/* User Menu - Desktop */}
            {user ? (
              <div className="hidden md:flex items-center gap-1">
                {/* Role-based dashboard links */}
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10">
                      <Shield className="h-[18px] w-[18px]" />
                    </Button>
                  </Link>
                )}
                {isDoctor && (
                  <Link to="/doctor/dashboard">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 ${isActive('/doctor') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
                    >
                      <Stethoscope className="h-[18px] w-[18px]" />
                    </Button>
                  </Link>
                )}
                {isClinicOwner && (
                  <Link to="/clinic/dashboard">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-9 w-9 ${isActive('/clinic') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`}
                    >
                      <Building2 className="h-[18px] w-[18px]" />
                    </Button>
                  </Link>
                )}
                <PetSwitcher />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-3 cursor-pointer">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button size="sm" className="font-medium shadow-sm hover:shadow-md transition-shadow">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="p-4 pb-2 border-b border-border/50">
                  <SheetTitle className="flex items-center gap-3">
                    <img 
                      src={logo} 
                      alt="VET-MEDIX" 
                      className="h-10 w-10 rounded-xl object-cover border-2 border-primary/20"
                    />
                    <div>
                      <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        VET-MEDIX
                      </span>
                      <p className="text-xs text-muted-foreground font-normal">Social • Shop • Care</p>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Mobile Search */}
                <form onSubmit={(e) => { handleSearch(e); setIsMenuOpen(false); }} className="p-4 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search pets, products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </form>

                {/* Mobile Navigation Links */}
                <div className="flex flex-col p-4 pt-2 gap-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Navigation</p>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.path);
                    return (
                      <Link 
                        key={link.path}
                        to={link.path} 
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        {link.label}
                      </Link>
                    );
                  })}

                  <div className="h-px bg-border/50 my-3" />

                  {user ? (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">Account</p>
                      
                      {/* Role-based links */}
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                        >
                          <Shield className="h-5 w-5" />
                          Admin Panel
                        </Link>
                      )}
                      {isDoctor && (
                        <Link 
                          to="/doctor/dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive('/doctor') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'
                          }`}
                        >
                          <Stethoscope className="h-5 w-5" />
                          Doctor Dashboard
                        </Link>
                      )}
                      {isClinicOwner && (
                        <Link 
                          to="/clinic/dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive('/clinic') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'
                          }`}
                        >
                          <Building2 className="h-5 w-5" />
                          Clinic Dashboard
                        </Link>
                      )}

                      <Link 
                        to="/messages" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all"
                      >
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        Messages
                      </Link>

                      <Link 
                        to="/pets/new" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all"
                      >
                        <Plus className="h-5 w-5" />
                        Add Pet
                      </Link>

                      <Link 
                        to="/profile" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all"
                      >
                        <User className="h-5 w-5 text-muted-foreground" />
                        Profile
                      </Link>

                      <div className="h-px bg-border/50 my-3" />

                      <button 
                        onClick={() => { signOut(); setIsMenuOpen(false); }} 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link 
                      to="/auth" 
                      onClick={() => setIsMenuOpen(false)}
                      className="mt-2"
                    >
                      <Button className="w-full font-medium">Sign In</Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
