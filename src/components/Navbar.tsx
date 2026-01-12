import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Home, Users, Store, Stethoscope, PawPrint, Compass, MessageCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useAdmin } from '@/hooks/useAdmin';
import { PetSwitcher } from '@/components/social/PetSwitcher';
import { NotificationBell } from '@/components/social/NotificationBell';
import logo from '@/assets/logo.jpeg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img 
                src={logo} 
                alt="PetConnect Logo" 
                className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover shadow-soft border-2 border-primary/20 group-hover:border-primary/40 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                <PawPrint className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-display font-bold text-foreground">PetConnect</h1>
              <p className="text-xs text-muted-foreground">Social • Shop • Care</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pets, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/feed">
              <Button 
                variant={isActive('/feed') ? 'secondary' : 'ghost'} 
                size="sm" 
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Feed
              </Button>
            </Link>
            <Link to="/explore">
              <Button 
                variant={isActive('/explore') ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <Compass className="h-4 w-4" />
                Explore
              </Button>
            </Link>
            <Link to="/shop">
              <Button 
                variant={isActive('/shop') ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <Store className="h-4 w-4" />
                Shop
              </Button>
            </Link>
            <Link to="/clinics">
              <Button 
                variant={isActive('/clinics') ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <Stethoscope className="h-4 w-4" />
                Clinics
              </Button>
            </Link>
            
            <div className="w-px h-6 bg-border mx-1" />

            {user && (
              <Link to="/messages">
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <NotificationBell />

            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Button>

            {user ? (
              <div className="flex items-center gap-1">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="text-primary">
                      <Shield className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <PetSwitcher />
                <Link to="/profile">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Button>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pets, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-full bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>
        </form>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1 pt-4">
              <Link 
                to="/feed" 
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 ${
                  isActive('/feed') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                Feed
              </Link>
              <Link 
                to="/shop" 
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 ${
                  isActive('/shop') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Store className="h-5 w-5" />
                Shop
              </Link>
              <Link 
                to="/clinics" 
                className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors flex items-center gap-3 ${
                  isActive('/clinics') ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Stethoscope className="h-5 w-5" />
                Clinics
              </Link>
              
              <div className="h-px bg-border my-2" />
              
              {user ? (
                <>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </Link>
                  )}
                  <Link 
                    to="/pets/new" 
                    className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <PawPrint className="h-5 w-5" />
                    Add Pet
                  </Link>
                  <Link 
                    to="/profile" 
                    className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    Profile
                  </Link>
                  <button 
                    onClick={() => { signOut(); setIsMenuOpen(false); }} 
                    className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left flex items-center gap-3"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="px-4 py-3 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;