import { Star, MapPin, Clock, Stethoscope, ChevronRight, Phone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import gopalganjLogo from '@/assets/gopalganj-vet-care-logo.png';

interface ClinicCardProps {
  id?: string;
  name: string;
  rating: number;
  distance: string;
  services: string[];
  image: string;
  isOpen?: boolean;
  isVerified?: boolean;
  onBook?: () => void;
  onViewDetails?: () => void;
}

const ClinicCard = ({ name, rating, distance, services, image, isOpen = true, isVerified = true, onBook, onViewDetails }: ClinicCardProps) => {
  const isGopalganj = name?.toLowerCase().includes('gopalganj');
  
  return (
    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div 
          className="relative sm:w-36 md:w-44 lg:w-52 aspect-[16/10] sm:aspect-square flex-shrink-0 cursor-pointer overflow-hidden"
          onClick={onViewDetails}
        >
          {isGopalganj ? (
            <img 
              src={gopalganjLogo} 
              alt={name} 
              className="w-full h-full object-cover bg-white group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          )}
          
          {/* Status Badge on Image */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 ${
                isOpen 
                  ? 'bg-accent text-accent-foreground shadow-sm' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              {isOpen ? 'Open Now' : 'Closed'}
            </Badge>
          </div>

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
              <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground rounded-full p-1 sm:p-1.5 shadow-sm">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 
                className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary cursor-pointer transition-colors line-clamp-1"
                onClick={onViewDetails}
              >
                {name}
              </h3>
              <div className="flex items-center gap-3 mt-1.5">
                {/* Rating */}
                <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5">
                  <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary fill-primary" />
                  <span className="text-xs sm:text-sm font-semibold text-primary">{rating.toFixed(1)}</span>
                </div>
                {/* Distance */}
                <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {distance}
                </span>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
            {services.slice(0, 3).map((service, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-lg bg-secondary/50 text-secondary-foreground border border-border/50"
              >
                <Stethoscope className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-70" />
                {service}
              </span>
            ))}
            {services.length > 3 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                +{services.length - 3} more
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 sm:gap-3 mt-auto pt-2 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm rounded-xl hover:bg-secondary/50 active:scale-[0.98] transition-all" 
              onClick={onViewDetails}
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 opacity-70" />
              Details
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-9 sm:h-10 text-xs sm:text-sm rounded-xl shadow-sm hover:shadow active:scale-[0.98] transition-all" 
              onClick={onBook}
            >
              Book Now
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
