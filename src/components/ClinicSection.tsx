import { useState, useEffect } from 'react';
import { MapPin, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import ClinicCard from './ClinicCard';
import { supabase } from '@/integrations/supabase/client';

interface Clinic {
  id: string;
  name: string;
  rating: number | null;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  is_open: boolean | null;
}

const ClinicSection = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .limit(3);
      
      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'Surgery', 'Pharmacy', '24/7', 'Large Animal'];

  const handleBookClinic = (clinicId: string) => {
    navigate(`/book-appointment/${clinicId}`);
  };

  return (
    <section id="clinics" className="section-padding bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
              <MapPin className="h-4 w-4" />
              Find Nearby
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Veterinary Clinics
            </h2>
            <p className="text-muted-foreground">
              Book appointments with trusted veterinarians near you
            </p>
          </div>
          <Link to="/clinics">
            <Button variant="outline" className="mt-4 md:mt-0">
              <Filter className="h-4 w-4 mr-2" />
              View All Clinics
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((filter, index) => (
            <button
              key={index}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground border border-border hover:border-primary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Clinic Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No clinics found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clinics.map((clinic) => (
              <ClinicCard 
                key={clinic.id}
                id={clinic.id}
                name={clinic.name}
                rating={clinic.rating || 4.5}
                distance={clinic.distance || '2 km'}
                services={clinic.services || []}
                image={clinic.image_url || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop'}
                isOpen={clinic.is_open ?? true}
                onBook={() => handleBookClinic(clinic.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ClinicSection;