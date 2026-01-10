import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, LogOut, Heart, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import logo from '@/assets/logo.jpeg';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img 
                src={logo} 
                alt="VET-MEDIX Logo" 
                className="h-12 w-12 md:h-14 md:w-14 rounded-full object-cover shadow-soft border-2 border-primary/20 group-hover:border-primary/40 transition-colors"
              />
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                <PawPrint className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-display font-bold text-foreground">VET-MEDIX</h1>
              <p className="text-xs text-muted-foreground">One Stop Pet Care</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-full bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/shop">
              <Button variant="ghost" size="sm" className="text-foreground">Shop</Button>
            </Link>
            <Link to="/clinics">
              <Button variant="ghost" size="sm" className="text-foreground">Clinics</Button>
            </Link>
            
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
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
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-full bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>
        </form>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-1 pt-4">
              <Link to="/shop" className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                Shop
              </Link>
              <Link to="/clinics" className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                Clinics
              </Link>
              {user ? (
                <>
                  <Link to="/profile" className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                    Profile
                  </Link>
                  <button onClick={signOut} className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors text-left">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/auth" className="px-4 py-3 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors">
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