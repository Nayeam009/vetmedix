import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Home, Store, Stethoscope, PawPrint, Compass, MessageCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import { NotificationBell } from '@/components/social/NotificationBell';
import Logo from '@/components/Logo';
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    user,
    signOut
  } = useAuth();
  const {
    totalItems
  } = useCart();
  const {
    isDoctor,
    isClinicOwner
  } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  return <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Logo */}
          <Logo to="/" size="md" showText showSubtitle className="flex-shrink-0" />

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-4 xl:mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search pets, products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-4 rounded-full bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
            <Link to="/feed">
              <Button variant={isActive('/feed') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                <Home className="h-4 w-4" />
                <span className="hidden lg:inline">Feed</span>
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant={isActive('/explore') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                <Compass className="h-4 w-4" />
                <span className="hidden lg:inline">Explore</span>
              </Button>
            </Link>
            <Link to="/shop">
              <Button variant={isActive('/shop') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                <Store className="h-4 w-4" />
                <span className="hidden lg:inline">Shop</span>
              </Button>
            </Link>
            <Link to="/clinics">
              <Button variant={isActive('/clinics') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                <Stethoscope className="h-4 w-4" />
                <span className="hidden lg:inline">Clinics</span>
              </Button>
            </Link>

            {/* Clinic Owner Link */}
            {isClinicOwner && <Link to="/clinic/dashboard">
                <Button variant={isActive('/clinic') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden xl:inline">My Clinic</span>
                </Button>
              </Link>}

            {/* Doctor Link */}
            {isDoctor && <Link to="/doctor/dashboard">
                <Button variant={isActive('/doctor') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                  <Stethoscope className="h-4 w-4" />
                  <span className="hidden xl:inline">Doctor</span>
                </Button>
              </Link>}

            <div className="w-px h-6 bg-border mx-0.5 lg:mx-1" />

            {user && <Link to="/messages">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
              </Link>}

            <NotificationBell />

            <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
              {totalItems > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 lg:h-5 lg:w-5 rounded-full bg-primary text-primary-foreground text-[10px] lg:text-xs flex items-center justify-center font-medium">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>}
            </Button>

            {user ? <div className="flex items-center gap-0.5">
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
              signOut();
              navigate('/');
            }}>
                  <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
              </div> : <Link to="/auth">
                <Button variant="default" size="sm" className="h-9">Sign In</Button>
              </Link>}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => navigate('/cart')}>
              
              {totalItems > 0 && <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>}
            </Button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-2 sm:pb-3">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search pets, products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-4 rounded-full bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" />
          </div>
        </form>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="md:hidden pb-3 sm:pb-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-0.5 sm:gap-1 pt-3 sm:pt-4">
              <Link to="/feed" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/feed') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} onClick={() => setIsMenuOpen(false)}>
                <Home className="h-5 w-5" />
                Feed
              </Link>
              <Link to="/explore" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/explore') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} onClick={() => setIsMenuOpen(false)}>
                <Compass className="h-5 w-5" />
                Explore
              </Link>
              <Link to="/shop" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/shop') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} onClick={() => setIsMenuOpen(false)}>
                <Store className="h-5 w-5" />
                Shop
              </Link>
              <Link to="/clinics" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/clinics') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} onClick={() => setIsMenuOpen(false)}>
                <Stethoscope className="h-5 w-5" />
                Clinics
              </Link>

              <div className="h-px bg-border my-1.5 sm:my-2" />

              {user ? <>
                  {/* Role-based dashboard links */}
                  {isDoctor && <Link to="/doctor/dashboard" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/doctor') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`} onClick={() => setIsMenuOpen(false)}>
                      <Stethoscope className="h-5 w-5" />
                      Doctor Dashboard
                    </Link>}
                  {isClinicOwner && <Link to="/clinic/dashboard" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/clinic') ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/10'}`} onClick={() => setIsMenuOpen(false)}>
                      <Building2 className="h-5 w-5" />
                      Clinic Dashboard
                    </Link>}
                  <Link to="/pets/new" className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98]" onClick={() => setIsMenuOpen(false)}>
                    <PawPrint className="h-5 w-5" />
                    Add Pet
                  </Link>
                  <Link to="/profile" className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98]" onClick={() => setIsMenuOpen(false)}>
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <button onClick={() => {
              signOut();
              setIsMenuOpen(false);
            }} className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left flex items-center gap-3 active:scale-[0.98]">
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </> : <Link to="/auth" className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors active:scale-[0.98]" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Link>}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navbar;