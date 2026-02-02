import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Home, Store, Stethoscope, PawPrint, Compass, MessageCircle, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import { NotificationBell } from '@/components/social/NotificationBell';
import Logo from '@/components/Logo';
import { GlobalSearch } from '@/components/GlobalSearch';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  return <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          {/* Logo */}
          <Logo to="/" size="md" showText showSubtitle className="flex-shrink-0" />

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4 xl:mx-6">
            <GlobalSearch variant="navbar" className="w-full" />
          </div>

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
                <Building2 className="h-4 w-4" />
                <span className="hidden lg:inline">Clinics</span>
              </Button>
            </Link>
            <Link to="/doctors">
              <Button variant={isActive('/doctors') ? 'secondary' : 'ghost'} size="sm" className="gap-1.5 h-9 px-2.5 lg:px-3">
                <Users className="h-4 w-4" />
                <span className="hidden lg:inline">Doctors</span>
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
                <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="View messages">
                  <MessageCircle className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
              </Link>}

            <NotificationBell />


            {user ? <div className="flex items-center gap-0.5">
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="View your profile">
                    <User className="h-4 w-4 lg:h-5 lg:w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Sign out of your account" onClick={() => {
              signOut();
              navigate('/');
            }}>
                  <LogOut className="h-4 w-4 lg:h-5 lg:w-5" />
                </Button>
              </div> : <Link to="/auth">
                <Button variant="default" size="sm" className="h-11 px-4">Sign In</Button>
              </Link>}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            <NotificationBell />
            <button 
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors active:scale-95" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-2 sm:pb-3">
          <GlobalSearch variant="navbar" className="w-full" />
        </div>

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
                <Building2 className="h-5 w-5" />
                Clinics
              </Link>
              <Link to="/doctors" className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 active:scale-[0.98] ${isActive('/doctors') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'}`} onClick={() => setIsMenuOpen(false)}>
                <Users className="h-5 w-5" />
                Doctors
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