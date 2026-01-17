import { Star, MapPin, Clock, Stethoscope, ChevronRight, Phone, Shield, Award, Users } from 'lucide-react';
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
    <div className="group bg-white rounded-2xl overflow-hidden border border-border/60 hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div 
          className="relative w-full sm:w-36 md:w-44 lg:w-52 aspect-[16/10] sm:aspect-square flex-shrink-0 cursor-pointer overflow-hidden bg-gradient-to-br from-primary/5 to-orange-50"
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status Badge on Image */}
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
            <Badge 
              variant={isOpen ? "default" : "secondary"}
              className={cn(
                "text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 shadow-lg backdrop-blur-md border-0",
                isOpen 
                  ? 'bg-emerald-500/95 text-white hover:bg-emerald-500' 
                  : 'bg-gray-600/95 text-white hover:bg-gray-600'
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full mr-1.5",
                isOpen ? "bg-white animate-pulse" : "bg-gray-300"
              )} />
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
          </div>

          {/* Verified Badge */}
          {isVerified && (
            <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
              <div className="bg-white/95 backdrop-blur-md text-primary rounded-full p-1.5 sm:p-2 shadow-lg">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
            </div>
          )}

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-xs">
              <Users className="h-3 w-3" />
              <span>50+ patients</span>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="flex-1 p-4 sm:p-5 lg:p-6 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <h3 
                className="font-bold text-base sm:text-lg lg:text-xl text-foreground group-hover:text-primary cursor-pointer transition-colors line-clamp-1 mb-1.5"
                onClick={onViewDetails}
              >
                {name}
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Rating */}
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
                  <span className="text-xs text-amber-600/70">(48)</span>
                </div>
                {/* Distance */}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {distance}
                </span>
                {/* Verified Text */}
                {isVerified && (
                  <span className="hidden sm:flex items-center gap-1 text-xs text-primary font-medium">
                    <Award className="h-3 w-3" />
                    Certified
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Services */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 flex-1">
            {services.slice(0, 3).map((service, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r from-primary/5 to-orange-50 text-primary/90 border border-primary/10"
              >
                <Stethoscope className="h-2.5 w-2.5 opacity-70" />
                <span className="truncate max-w-[70px] sm:max-w-[90px]">{service}</span>
              </span>
            ))}
            {services.length > 3 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground bg-muted/60 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg font-medium">
                +{services.length - 3} more
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2.5 pt-3 border-t border-border/50">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm rounded-xl hover:bg-secondary/80 active:scale-[0.98] transition-all font-medium" 
              onClick={onViewDetails}
            >
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 opacity-70" />
              View Details
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 h-9 sm:h-10 lg:h-11 text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all font-semibold" 
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
