import { MapPin, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClinicCard from './ClinicCard';

const ClinicSection = () => {
  const clinics = [
    {
      name: 'Vet Care Lalmatia',
      rating: 4.8,
      distance: '1.2 km',
      services: ['Surgery', 'Vaccine', '24/7'],
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop',
      isOpen: true,
    },
    {
      name: 'Savar Dairy Vet Point',
      rating: 4.5,
      distance: '12 km',
      services: ['Large Animal', 'Farm Visits'],
      image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=400&fit=crop',
      isOpen: true,
    },
    {
      name: 'PetCare Plus Gulshan',
      rating: 4.9,
      distance: '3.5 km',
      services: ['Grooming', 'Dental', 'Vaccination'],
      image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=400&fit=crop',
      isOpen: false,
    },
  ];

  const filters = ['All', 'Surgery', 'Pharmacy', '24/7', 'Large Animal'];

  return (
    <section id="clinics" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
              <MapPin className="h-4 w-4" />
              Find Nearby
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Veterinary Clinics
            </h2>
            <p className="text-muted-foreground">
              Book appointments with trusted veterinarians near you
            </p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            <Filter className="h-4 w-4 mr-2" />
            View All Clinics
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((filter, index) => (
            <button
              key={index}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                index === 0
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-card text-foreground border border-border hover:border-secondary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Clinic Cards */}
        <div className="space-y-4">
          {clinics.map((clinic, index) => (
            <ClinicCard key={index} {...clinic} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClinicSection;
