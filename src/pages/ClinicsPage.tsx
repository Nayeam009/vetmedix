import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Loader2, MapPin, Filter, Star, 
  Building2, Clock, Shield, ChevronDown, X,
  Stethoscope, Heart, Award
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import ClinicCard from '@/components/ClinicCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

const serviceFilters = [
  'All Services',
  'General Checkup',
  'Vaccination',
  'Surgery',
  'Dental Care',
  'Emergency Care',
  'Grooming',
  'X-Ray & Imaging',
];

const ClinicsPage = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('All Services');
  const [sortBy, setSortBy] = useState('recommended');
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      // Use clinics_public view for security - excludes sensitive verification documents
      const { data, error } = await supabase
        .from('clinics_public')
        .select('*');
      if (error) throw error;
      
      const sorted = (data || []).sort((a, b) => {
        const aIsGopalganj = a.name?.toLowerCase().includes('gopalganj');
        const bIsGopalganj = b.name?.toLowerCase().includes('gopalganj');
        if (aIsGopalganj && !bIsGopalganj) return -1;
        if (!aIsGopalganj && bIsGopalganj) return 1;
        return 0;
      });
      
      setClinics(sorted);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching clinics:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredClinics = clinics
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(c => selectedService === 'All Services' || c.services?.includes(selectedService))
    .filter(c => !showOnlyOpen || c.is_open)
    .filter(c => !showOnlyVerified || c.is_verified)
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const activeFiltersCount = [
    selectedService !== 'All Services',
    showOnlyOpen,
    showOnlyVerified,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedService('All Services');
    setShowOnlyOpen(false);
    setShowOnlyVerified(false);
    setSearchQuery('');
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Service Filter */}
      <div>
        <h4 className="font-medium mb-3">Service Type</h4>
        <div className="flex flex-wrap gap-2">
          {serviceFilters.map((service) => (
            <Badge
              key={service}
              variant={selectedService === service ? 'default' : 'outline'}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => setSelectedService(service)}
            >
              {service}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="font-medium mb-3">Status</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyOpen}
              onChange={(e) => setShowOnlyOpen(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Open Now</span>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyVerified}
              onChange={(e) => setShowOnlyVerified(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm">Verified Only</span>
            </div>
          </label>
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-background to-background pb-24 md:pb-0">
      <Navbar />
      
      {/* Hero Banner - Optimized for mobile */}
      <div className="relative bg-gradient-to-r from-primary/10 via-orange-100/50 to-amber-50 border-b border-border/50 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 lg:py-14">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-primary text-[10px] sm:text-xs lg:text-sm font-semibold mb-2 sm:mb-3 bg-white/80 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" /> 
              Find Trusted Veterinary Care
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-2 sm:mb-3">
              Veterinary Clinics
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-md sm:max-w-xl mx-auto mb-4 sm:mb-6 px-2">
              Find and book appointments with trusted veterinary clinics near you.
            </p>

            {/* Search Bar - Mobile optimized */}
            <div className="max-w-2xl mx-auto px-1">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search clinics..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-12 lg:h-14 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl bg-white border border-border/50 focus:border-primary focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm shadow-md shadow-black/5"
                />
              </div>
            </div>

            {/* Quick Stats - Mobile optimized */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-10 mt-4 sm:mt-6">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{clinics.length}+</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Clinics</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">4.8</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Avg Rating</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">24/7</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Emergency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-primary/5 rounded-full blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-0 right-0 w-24 sm:w-40 h-24 sm:h-40 bg-orange-200/30 rounded-full blur-2xl sm:blur-3xl" />
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Filter Bar - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          {/* Filters Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="sm:hidden gap-1.5 h-8 text-xs flex-shrink-0">
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="default" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-80">
                <SheetHeader>
                  <SheetTitle>Filter Clinics</SheetTitle>
                </SheetHeader>
                <div className="mt-4 sm:mt-6">
                  {filterContent}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="w-40 bg-white h-9 text-sm">
                  <Stethoscope className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceFilters.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showOnlyOpen ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className="gap-1.5 h-9 text-sm"
              >
                <Clock className="h-3.5 w-3.5" />
                Open Now
              </Button>

              <Button
                variant={showOnlyVerified ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyVerified(!showOnlyVerified)}
                className="gap-1.5 h-9 text-sm"
              >
                <Shield className="h-3.5 w-3.5" />
                Verified
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-9 text-sm">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Mobile Quick Filters */}
            <div className="flex sm:hidden items-center gap-1.5 flex-shrink-0">
              <Button
                variant={showOnlyOpen ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyOpen(!showOnlyOpen)}
                className="gap-1 h-8 text-xs px-2.5"
              >
                <Clock className="h-3 w-3" />
                Open
              </Button>
              <Button
                variant={showOnlyVerified ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyVerified(!showOnlyVerified)}
                className="gap-1 h-8 text-xs px-2.5"
              >
                <Shield className="h-3 w-3" />
                Verified
              </Button>
            </div>
          </div>

          {/* Sort and Count Row */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''}
            </span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 sm:w-36 bg-white h-8 sm:h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display - Mobile optimized */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3 sm:mb-4">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Filters:</span>
            {selectedService !== 'All Services' && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                {selectedService}
                <X 
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer" 
                  onClick={() => setSelectedService('All Services')}
                />
              </Badge>
            )}
            {showOnlyOpen && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                Open
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer" onClick={() => setShowOnlyOpen(false)} />
              </Badge>
            )}
            {showOnlyVerified && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                Verified
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 cursor-pointer" onClick={() => setShowOnlyVerified(false)} />
              </Badge>
            )}
          </div>
        )}

        {/* Clinics Grid - Mobile optimized */}
        {loading ? (
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-border p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2 sm:space-y-3">
                    <Skeleton className="h-5 sm:h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-1.5 sm:gap-2">
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                    </div>
                    <div className="flex gap-2 pt-1 sm:pt-2">
                      <Skeleton className="h-8 sm:h-10 flex-1" />
                      <Skeleton className="h-8 sm:h-10 flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-10 sm:py-16 bg-white rounded-xl sm:rounded-2xl border border-border max-w-sm sm:max-w-lg mx-auto">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Building2 className="h-7 w-7 sm:h-10 sm:w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">No clinics found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={clearFilters} variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            {filteredClinics.map(clinic => (
              <ClinicCard 
                key={clinic.id} 
                id={clinic.id} 
                name={clinic.name}
                rating={clinic.rating || 4.5} 
                distance={clinic.distance || '2 km'}
                services={clinic.services || []} 
                image={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400'}
                isOpen={clinic.is_open ?? true}
                isVerified={clinic.is_verified ?? true}
                onBook={() => navigate(`/book-appointment/${clinic.id}`)}
                onViewDetails={() => navigate(`/clinic/${clinic.id}`)}
              />
            ))}
          </div>
        )}

        {/* Trust Section - Mobile optimized */}
        <div className="mt-8 sm:mt-12 lg:mt-16 bg-gradient-to-r from-primary/5 via-orange-50/50 to-amber-50/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-foreground mb-1 sm:mb-2">
              Why Choose Our Clinics?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Quality veterinary care you can trust
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">Verified</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Licensed by veterinary authorities
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">Expert</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Specialized qualifications
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-rose-500" />
              </div>
              <h3 className="font-semibold text-foreground text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">Caring</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Gentle treatment every visit
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ClinicsPage;
