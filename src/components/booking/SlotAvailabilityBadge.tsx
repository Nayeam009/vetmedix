import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SlotAvailabilityBadgeProps {
  isFullyBooked: boolean;
  waitlistCount: number;
  isOnWaitlist: boolean;
  className?: string;
}

const SlotAvailabilityBadge = ({
  isFullyBooked,
  waitlistCount,
  isOnWaitlist,
  className,
}: SlotAvailabilityBadgeProps) => {
  if (isOnWaitlist) {
    return (
      <Badge 
        variant="outline" 
        className={cn("bg-primary/10 text-primary border-primary/30", className)}
      >
        On Waitlist
      </Badge>
    );
  }

  if (isFullyBooked) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="destructive">Fully Booked</Badge>
        {waitlistCount > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {waitlistCount} waiting
          </span>
        )}
      </div>
    );
  }

  return (
    <Badge variant="outline" className={cn("bg-green-500/10 text-green-600 border-green-500/30", className)}>
      Available
    </Badge>
  );
};

export default SlotAvailabilityBadge;
