import { Star, MapPin, Clock, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClinicCardProps {
  id?: string;
  name: string;
  rating: number;
  distance: string;
  services: string[];
  image: string;
  isOpen?: boolean;
  onBook?: () => void;
}

const ClinicCard = ({ name, rating, distance, services, image, isOpen = true, onBook }: ClinicCardProps) => {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover border border-border transition-all duration-300">
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-40 md:w-48 aspect-video sm:aspect-square flex-shrink-0">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-4 md:p-5 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground">{name}</h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  {rating}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {distance}
                </span>
              </div>
            </div>
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              isOpen ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="h-3 w-3" />
              {isOpen ? 'Open Now' : 'Closed'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {services.map((service, index) => (
              <span key={index} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                <Stethoscope className="h-3 w-3" />
                {service}
              </span>
            ))}
          </div>
          <Button variant="default" className="w-full sm:w-auto mt-auto" onClick={onBook}>
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
