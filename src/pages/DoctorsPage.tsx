import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Loader2, Filter, ChevronDown, X,
  Stethoscope, Award, Clock, MapPin, Users
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import DoctorCard from '@/components/DoctorCard';
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
import { usePublicDoctors } from '@/hooks/usePublicDoctors';

const SPECIALIZATIONS = [
  'All Specializations',
  'General Veterinarian',
  'Surgery',
  'Dermatology',
  'Cardiology',
  'Orthopedics',
  'Dentistry',
  'Oncology',
  'Neurology',
  'Emergency Care',
  'Exotic Animals',
  'Farm Animals',
  'Internal Medicine',
  'Ophthalmology',
  'Radiology',
];

const DoctorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [sortBy, setSortBy] = useState('recommended');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const navigate = useNavigate();

  const { data: doctors, isLoading } = usePublicDoctors();

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];

    return doctors
      .filter((d) => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((d) => 
        selectedSpecialization === 'All Specializations' || 
        d.specialization === selectedSpecialization
      )
      .filter((d) => !showOnlyAvailable || d.is_available)
      .filter((d) => !showOnlyVerified || d.is_verified)
      .sort((a, b) => {
        if (sortBy === 'experience') {
          return (b.experience_years || 0) - (a.experience_years || 0);
        }
        if (sortBy === 'fee_low') {
          return (a.consultation_fee || 0) - (b.consultation_fee || 0);
        }
        if (sortBy === 'fee_high') {
          return (b.consultation_fee || 0) - (a.consultation_fee || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        // Default: verified first, then available
        if (a.is_verified !== b.is_verified) return b.is_verified ? 1 : -1;
        if (a.is_available !== b.is_available) return b.is_available ? 1 : -1;
        return 0;
      });
  }, [doctors, searchQuery, selectedSpecialization, sortBy, showOnlyAvailable, showOnlyVerified]);

  const activeFiltersCount = [
    selectedSpecialization !== 'All Specializations',
    showOnlyAvailable,
    showOnlyVerified,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedSpecialization('All Specializations');
    setShowOnlyAvailable(false);
    setShowOnlyVerified(false);
    setSearchQuery('');
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Specialization Filter */}
      <div>
        <h4 className="font-medium mb-3">Specialization</h4>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((spec) => (
            <Badge
              key={spec}
              variant={selectedSpecialization === spec ? 'default' : 'outline'}
              className="cursor-pointer transition-all hover:scale-105"
              onClick={() => setSelectedSpecialization(spec)}
            >
              {spec}
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
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Available Now</span>
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
              <Award className="h-4 w-4 text-primary" />
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background pb-24 md:pb-0">
      <Navbar />
      
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-primary/10 via-blue-100/50 to-cyan-50 border-b border-border/50 overflow-hidden">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 lg:py-14">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-primary text-[10px] sm:text-xs lg:text-sm font-semibold mb-2 sm:mb-3 bg-white/80 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm">
              <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4" /> 
              Expert Veterinary Care
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-2 sm:mb-3">
              Find Veterinarian Doctors
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-md sm:max-w-xl mx-auto mb-4 sm:mb-6 px-2">
              Browse verified veterinarian doctors from trusted clinics and book appointments instantly.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto px-1">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search doctors by name, specialization..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-12 lg:h-14 pl-9 sm:pl-12 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl bg-white border border-border/50 focus:border-primary focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm shadow-md shadow-black/5"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-10 mt-4 sm:mt-6">
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{doctors?.length || 0}+</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Doctors</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                  {SPECIALIZATIONS.length - 1}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Specializations</div>
              </div>
              <div className="w-px h-6 sm:h-8 bg-border" />
              <div className="text-center">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">100%</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Verified Clinics</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-20 sm:w-32 h-20 sm:h-32 bg-primary/5 rounded-full blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-0 right-0 w-24 sm:w-40 h-24 sm:h-40 bg-blue-200/30 rounded-full blur-2xl sm:blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-1.5 h-9">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="h-5 w-5 p-0 flex items-center justify-center ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filter Doctors</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{filterContent}</div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-2">
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((spec) => (
                    <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={showOnlyAvailable ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                className="gap-1.5 h-9"
              >
                <Clock className="h-3.5 w-3.5" />
                Available
              </Button>

              <Button
                variant={showOnlyVerified ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyVerified(!showOnlyVerified)}
                className="gap-1.5 h-9"
              >
                <Award className="h-3.5 w-3.5" />
                Verified
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="fee_low">Fee: Low to High</SelectItem>
                <SelectItem value="fee_high">Fee: High to Low</SelectItem>
                <SelectItem value="name">Name: A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${filteredDoctors.length} doctors found`}
          </p>
        </div>

        {/* Doctors Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDoctors.map((doctor) => (
              <DoctorCard
                key={`${doctor.id}-${doctor.clinic_id}`}
                {...doctor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trust Section */}
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="bg-gradient-to-r from-primary/5 via-blue-50 to-cyan-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">
              Why Choose Our Doctors?
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              All doctors are from admin-verified veterinary clinics
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Award, title: 'Verified Clinics', desc: 'All from trusted clinics' },
              { icon: Stethoscope, title: 'Expert Care', desc: 'Specialized treatments' },
              { icon: Clock, title: 'Easy Booking', desc: 'Book appointments online' },
              { icon: MapPin, title: 'Multiple Locations', desc: 'Find doctors near you' },
            ].map((item, index) => (
              <div key={index} className="text-center p-3 sm:p-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-medium text-xs sm:text-sm text-foreground mb-0.5 sm:mb-1">{item.title}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default DoctorsPage;
