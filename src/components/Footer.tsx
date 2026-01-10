import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.jpeg';

const Footer = () => {
  return (
    <footer className="bg-foreground text-card">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <img 
                  src={logo} 
                  alt="VET-MEDIX Logo" 
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                  <PawPrint className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-display font-bold">VET-MEDIX</h3>
                <p className="text-xs text-card/70">One Stop Pet Care</p>
              </div>
            </div>
            <p className="text-sm text-card/70 mb-4">
              Your trusted partner for pet and farm animal care across Bangladesh.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-card/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Shop', path: '/shop' },
                { label: 'Clinics', path: '/clinics' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact', path: '/contact' },
                { label: 'FAQs', path: '/faq' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-card/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              {[
                { label: 'Dog Food', path: '/shop?type=dog' },
                { label: 'Cat Food', path: '/shop?type=cat' },
                { label: 'Cattle Feed', path: '/shop?type=cattle' },
                { label: 'Medicines', path: '/shop?type=medicine' },
                { label: 'Accessories', path: '/shop?type=accessory' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-sm text-card/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-card/70">
                <Phone className="h-4 w-4 text-primary" />
                +880 1700-000000
              </li>
              <li className="flex items-center gap-2 text-sm text-card/70">
                <Mail className="h-4 w-4 text-primary" />
                support@vetmedix.bd
              </li>
              <li className="flex items-start gap-2 text-sm text-card/70">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                House #12, Road #5, Dhanmondi, Dhaka-1205
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-card/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-card/50">
            © 2026 VET-MEDIX. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-card/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;