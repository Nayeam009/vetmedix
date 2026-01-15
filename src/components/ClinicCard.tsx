import { Star, MapPin, Clock, Stethoscope, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gopalganjLogo from '@/assets/gopalganj-vet-care-logo.png';

interface ClinicCardProps {
  id?: string;
  name: string;
  rating: number;
  distance: string;
  services: string[];
  image: string;
  isOpen?: boolean;
  onBook?: () => void;
  onViewDetails?: () => void;
}

const ClinicCard = ({ name, rating, distance, services, image, isOpen = true, onBook, onViewDetails }: ClinicCardProps) => {
  const isGopalganj = name?.toLowerCase().includes('gopalganj');
  
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-card hover:shadow-hover border border-border transition-all duration-300 active:scale-[0.99]">
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div 
          className="sm:w-32 md:w-40 lg:w-48 aspect-[16/10] sm:aspect-square flex-shrink-0 cursor-pointer"
          onClick={onViewDetails}
        >
          {isGopalganj ? (
            <img src={gopalganjLogo} alt={name} className="w-full h-full object-cover bg-white" />
          ) : (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-5 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <div className="min-w-0 flex-1">
              <h3 
                className="font-semibold text-base sm:text-lg text-foreground hover:text-primary cursor-pointer transition-colors truncate"
                onClick={onViewDetails}
              >
                {name}
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary fill-primary" />
                  {rating}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {distance}
                </span>
              </div>
            </div>
            <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
              isOpen ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          
          {/* Services */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {services.slice(0, 2).map((service, index) => (
              <span key={index} className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full bg-secondary text-secondary-foreground">
                <Stethoscope className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {service}
              </span>
            ))}
            {services.length > 2 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">+{services.length - 2} more</span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm rounded-lg sm:rounded-xl" 
              onClick={onViewDetails}
            >
              Details
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-8 sm:h-9 text-xs sm:text-sm rounded-lg sm:rounded-xl" 
              onClick={onBook}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
