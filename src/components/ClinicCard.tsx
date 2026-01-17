import { Star, MapPin, Clock, Stethoscope, ChevronRight, Phone, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
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
    <div className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div 
          className="relative w-full sm:w-32 md:w-40 lg:w-48 aspect-[16/9] sm:aspect-square flex-shrink-0 cursor-pointer overflow-hidden"
          onClick={onViewDetails}
        >
          {isGopalganj ? (
            <img 
              src={gopalganjLogo} 
              alt={name} 
              className="w-full h-full object-cover bg-white group-hover:scale-110 transition-transform duration-500" 
            />
          ) : (
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge on Image */}
          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={cn(
                "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 shadow-md backdrop-blur-sm",
                isOpen 
                  ? 'bg-emerald-500/90 text-white border-0' 
                  : 'bg-gray-500/90 text-white border-0'
              )}
            >
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              {isOpen ? 'Open Now' : 'Closed'}
            </Badge>
          </div>

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
              <div className="bg-primary text-primary-foreground rounded-full p-1 sm:p-1.5 shadow-md">
                <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="flex-1 p-3 sm:p-4 lg:p-5 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <div className="min-w-0 flex-1">
              <h3 
                className="font-bold text-sm sm:text-base lg:text-lg text-foreground group-hover:text-primary cursor-pointer transition-colors line-clamp-1"
                onClick={onViewDetails}
              >
                {name}
              </h3>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5">
                {/* Rating */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-amber-50 rounded-full px-1.5 sm:px-2 py-0.5">
                  <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] sm:text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
                </div>
                {/* Distance */}
                <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {distance}
                </span>
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
            {services.slice(0, 2).map((service, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] lg:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg bg-primary/5 text-primary border border-primary/10"
              >
                <Stethoscope className="h-2 w-2 sm:h-2.5 sm:w-2.5 opacity-70" />
                <span className="truncate max-w-[80px] sm:max-w-[100px]">{service}</span>
              </span>
            ))}
            {services.length > 2 && (
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground bg-muted/60 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-medium">
                +{services.length - 2} more
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-2 sm:pt-3 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-8 sm:h-9 lg:h-10 text-[10px] sm:text-xs lg:text-sm rounded-xl hover:bg-secondary/50 active:scale-[0.98] transition-all" 
              onClick={onViewDetails}
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
              Details
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-8 sm:h-9 lg:h-10 text-[10px] sm:text-xs lg:text-sm rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all" 
              onClick={onBook}
            >
              Book Now
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-0.5 sm:ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
