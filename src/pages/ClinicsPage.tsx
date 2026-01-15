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
      const { data, error } = await supabase.from('clinics').select('*');
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
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 text-primary text-xs sm:text-sm font-medium mb-2">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Find Nearby
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-1 sm:mb-2">
            Veterinary Clinics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Book appointments with trusted veterinarians</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search clinics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 sm:h-12 pl-9 sm:pl-11 pr-4 rounded-full bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Clinics List */}
        {loading ? (
          <div className="flex items-center justify-center h-48 sm:h-64">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No clinics found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
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