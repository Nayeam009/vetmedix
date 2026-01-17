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
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-10">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-primary text-xs sm:text-sm font-semibold mb-3 bg-primary/10 px-4 py-1.5 rounded-full">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
            Find Nearby
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-2 sm:mb-3">
            Veterinary Clinics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Book appointments with trusted veterinarians in your area
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-8 sm:mb-10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search clinics by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 sm:h-14 pl-11 sm:pl-12 pr-4 rounded-2xl bg-card border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm sm:text-base shadow-sm"
            />
          </div>
        </div>

        {/* Clinics Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading clinics...</p>
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border max-w-md mx-auto">
            <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No clinics found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 max-w-5xl mx-auto">
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