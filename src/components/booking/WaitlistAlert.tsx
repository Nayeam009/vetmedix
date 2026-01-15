import { useState } from 'react';
import { Bell, Clock, X, Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WaitlistEntry, useWaitlist } from '@/hooks/useWaitlist';
import { useNavigate } from 'react-router-dom';

interface WaitlistAlertProps {
  entry: WaitlistEntry;
  onDismiss?: () => void;
}

const WaitlistAlert = ({ entry, onDismiss }: WaitlistAlertProps) => {
  const navigate = useNavigate();
  const { convertToAppointment, cancelWaitlistEntry } = useWaitlist();
  const [loading, setLoading] = useState(false);

  const isNotified = entry.status === 'notified';
  
  // Calculate time remaining for notified entries
  const getTimeRemaining = () => {
    if (!entry.expires_at) return null;
    
    const now = new Date();
    const expires = new Date(entry.expires_at);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const handleBook = async () => {
    setLoading(true);
    const success = await convertToAppointment(entry);
    setLoading(false);
    
    if (success) {
      navigate('/profile');
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    await cancelWaitlistEntry(entry.id);
    setLoading(false);
    onDismiss?.();
  };

  const formattedDate = new Date(entry.preferred_date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (isNotified) {
    return (
      <Alert className="border-primary bg-primary/5 mb-4">
        <Bell className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-semibold flex items-center gap-2">
          🎉 Appointment Slot Available!
          {entry.expires_at && (
            <span className="text-xs font-normal bg-primary/10 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3 inline mr-1" />
              {getTimeRemaining()}
            </span>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-3">
            A slot at <strong>{entry.clinic?.name}</strong> on {formattedDate} at {entry.preferred_time} is now available for <strong>{entry.pet_name}</strong>!
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleBook} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Book Now
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDecline} disabled={loading}>
              Decline
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Regular waiting status
  return (
    <Alert className="border-muted mb-4">
      <Clock className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>On Waitlist</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleDecline}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        </Button>
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm">
          {entry.clinic?.name} • {formattedDate} at {entry.preferred_time}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Position #{entry.position} • {entry.pet_name} ({entry.pet_type})
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default WaitlistAlert;
