import { forwardRef } from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-foreground text-card">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-3 sm:mb-4">
              <Logo to="/" size="md" showText showSubtitle variant="footer" />
            </div>
            <p className="text-xs sm:text-sm text-card/70 mb-3 sm:mb-4 max-w-xs">
              Your trusted partner for pet and farm animal care across Bangladesh.
            </p>
            <nav aria-label="Social media links" className="flex gap-2 sm:gap-3">
              <a 
                href="https://www.facebook.com/profile.php?id=61573912760783"
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 w-11 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors active:scale-95"
                aria-label="Facebook page"
                onClick={(e) => { e.stopPropagation(); window.open('https://www.facebook.com/profile.php?id=61573912760783', '_blank', 'noopener,noreferrer'); }}
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <button 
                type="button"
                onClick={(e) => e.preventDefault()}
                className="h-11 w-11 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors active:scale-95 cursor-not-allowed opacity-60"
                aria-label="Instagram page - Coming soon"
                title="Coming soon"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button 
                type="button"
                onClick={(e) => e.preventDefault()}
                className="h-11 w-11 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors active:scale-95 cursor-not-allowed opacity-60"
                aria-label="YouTube channel - Coming soon"
                title="Coming soon"
              >
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </nav>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {[
                { label: 'Shop', path: '/shop' },
                { label: 'Clinics', path: '/clinics' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact', path: '/contact' },
                { label: 'FAQs', path: '/faq' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-card/80 hover:text-primary transition-colors inline-block py-1">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories */}
          <nav aria-label="Product categories">
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Categories</h4>
            <ul className="space-y-1.5 sm:space-y-2">
              {[
                { label: 'Dog Food', path: '/shop?type=dog' },
                { label: 'Cat Food', path: '/shop?type=cat' },
                { label: 'Cattle Feed', path: '/shop?type=cattle' },
                { label: 'Medicines', path: '/shop?type=medicine' },
                { label: 'Accessories', path: '/shop?type=accessory' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-card/80 hover:text-primary transition-colors inline-block py-1">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Contact Us</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-center gap-2 text-xs sm:text-sm text-card/70">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <a href="tel:+8801349219441" className="hover:text-primary transition-colors">01349219441</a>
              </li>
              <li className="flex items-center gap-2 text-xs sm:text-sm text-card/70">
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <a href="mailto:vetmedix.25@gmail.com" className="hover:text-primary transition-colors">vetmedix.25@gmail.com</a>
              </li>
              <li className="flex items-start gap-2 text-xs sm:text-sm text-card/70">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mt-0.5" />
                <span>Framgate, Dhaka, 1205</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-card/10 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-card/50 text-center sm:text-left">
            © 2026 VET-MEDIX. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs sm:text-sm text-card/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;