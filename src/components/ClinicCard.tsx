import { Star, MapPin, Stethoscope, ChevronRight, Phone, Shield, Award } from 'lucide-react';
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
    <div className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 hover:shadow-lg sm:hover:shadow-xl hover:shadow-primary/5">
      <div className="flex">
        {/* Image Section - Full height to fill card */}
        <div 
          className="relative w-24 sm:w-32 md:w-36 lg:w-44 flex-shrink-0 cursor-pointer overflow-hidden bg-gradient-to-br from-primary/5 to-orange-50"
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
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge on Image */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={cn(
                "text-[8px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 shadow-md backdrop-blur-md border-0",
                isOpen 
                  ? 'bg-emerald-500/95 text-white hover:bg-emerald-500' 
                  : 'bg-gray-600/95 text-white hover:bg-gray-600'
              )}
            >
              <div className={cn(
                "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full mr-1",
                isOpen ? "bg-white animate-pulse" : "bg-gray-300"
              )} />
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
              <div className="bg-white/95 backdrop-blur-md text-primary rounded-full p-1 sm:p-1.5 shadow-md">
                <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section - Mobile optimized */}
        <div className="flex-1 p-2.5 sm:p-4 lg:p-5 flex flex-col min-w-0">
          {/* Header */}
          <div className="mb-1.5 sm:mb-2">
            <h3 
              className="font-bold text-sm sm:text-base lg:text-lg text-foreground group-hover:text-primary cursor-pointer transition-colors line-clamp-1 mb-1"
              onClick={onViewDetails}
            >
              {name}
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Rating */}
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 sm:rounded-lg sm:px-2 sm:py-1">
                <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[10px] sm:text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
              </div>
              {/* Distance */}
              <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {distance}
              </span>
              {/* Verified Text - Hidden on smallest screens */}
              {isVerified && (
                <span className="hidden md:flex items-center gap-1 text-xs text-primary font-medium">
                  <Award className="h-3 w-3" />
                  Certified
                </span>
              )}
            </div>
          </div>
          
          {/* Services - Simplified for mobile */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3 flex-1">
            {services.slice(0, 2).map((service, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] lg:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-lg bg-primary/5 text-primary/80 border border-primary/10"
              >
                <Stethoscope className="h-2 w-2 sm:h-2.5 sm:w-2.5 opacity-70" />
                <span className="truncate max-w-[50px] sm:max-w-[70px] lg:max-w-[90px]">{service}</span>
              </span>
            ))}
            {services.length > 2 && (
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-lg font-medium">
                +{services.length - 2}
              </span>
            )}
          </div>
          
          {/* Actions - Compact for mobile */}
          <div className="flex gap-1.5 sm:gap-2 pt-2 sm:pt-3 border-t border-border/40">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 sm:h-8 lg:h-9 text-[10px] sm:text-xs rounded-lg hover:bg-secondary/80 active:scale-[0.98] transition-all font-medium px-2 sm:px-3" 
              onClick={onViewDetails}
            >
              <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 opacity-70" />
              <span className="hidden xs:inline">View</span> Details
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-7 sm:h-8 lg:h-9 text-[10px] sm:text-xs rounded-lg shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 active:scale-[0.98] transition-all font-semibold px-2 sm:px-3" 
              onClick={onBook}
            >
              Book<span className="hidden xs:inline"> Now</span>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;
