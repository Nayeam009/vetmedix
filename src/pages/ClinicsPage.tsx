import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import ClinicCard from '@/components/ClinicCard';
import { supabase } from '@/integrations/supabase/client';

const ClinicsPage = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .neq('is_blocked', true); // Exclude blocked clinics
      if (error) throw error;
      
      // Sort to put Gopalganj Vet Care at the top
      const sorted = (data || []).sort((a, b) => {
        const aIsGopalganj = a.name?.toLowerCase().includes('gopalganj');
        const bIsGopalganj = b.name?.toLowerCase().includes('gopalganj');
        if (aIsGopalganj && !bIsGopalganj) return -1;
        if (!aIsGopalganj && bIsGopalganj) return 1;
        return 0;
      });
      
      setClinics(sorted);
    } catch (error) {
      // Error logged only in development
      if (import.meta.env.DEV) {
        console.error('Error fetching clinics:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredClinics = clinics.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 pb-20 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 md:py-8 lg:py-10">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-primary text-[10px] sm:text-xs lg:text-sm font-semibold mb-2 sm:mb-3 bg-primary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full">
            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" /> 
            Find Nearby
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-1.5 sm:mb-2 lg:mb-3">
            Veterinary Clinics
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-md mx-auto px-4">
            Book appointments with trusted veterinarians in your area
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-6 sm:mb-8 lg:mb-10 px-2 sm:px-0">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search clinics by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 sm:h-12 lg:h-14 pl-9 sm:pl-11 lg:pl-12 pr-4 rounded-xl sm:rounded-2xl bg-card border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-xs sm:text-sm lg:text-base shadow-sm"
            />
          </div>
        </div>

        {/* Clinics Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 sm:h-64 gap-2 sm:gap-3">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">Loading clinics...</p>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-card rounded-xl sm:rounded-2xl border border-border max-w-md mx-auto mx-4 sm:mx-auto">
            <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mx-auto mb-2 sm:mb-3" />
            <p className="text-sm sm:text-base text-muted-foreground font-medium">No clinics found</p>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto">
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
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default ClinicsPage;