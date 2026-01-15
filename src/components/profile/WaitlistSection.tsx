import { Clock, Calendar, MapPin, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WaitlistEntry, useWaitlist } from '@/hooks/useWaitlist';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface WaitlistSectionProps {
  entries: WaitlistEntry[];
  loading: boolean;
}

const WaitlistSection = ({ entries, loading }: WaitlistSectionProps) => {
  const navigate = useNavigate();
  const { cancelWaitlistEntry, convertToAppointment } = useWaitlist();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleCancel = async (entryId: string) => {
    setActionLoading(entryId);
    await cancelWaitlistEntry(entryId);
    setActionLoading(null);
  };

  const handleBook = async (entry: WaitlistEntry) => {
    setActionLoading(entry.id);
    const success = await convertToAppointment(entry);
    setActionLoading(null);
    if (success) {
      navigate('/profile');
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            My Waitlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You're not on any waitlists</p>
            <Button className="mt-4" onClick={() => navigate('/clinics')}>
              Browse Clinics
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          My Waitlist
          <Badge variant="secondary" className="ml-2">{entries.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => {
            const isNotified = entry.status === 'notified';
            const formattedDate = new Date(entry.preferred_date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={entry.id}
                className={`p-4 rounded-lg border ${
                  isNotified 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium truncate">{entry.clinic?.name}</h4>
                      {isNotified && (
                        <Badge variant="default" className="bg-primary">
                          Slot Available!
                        </Badge>
                      )}
                      {!isNotified && entry.position && (
                        <Badge variant="outline">#{entry.position} in queue</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {entry.preferred_time}
                      </span>
                      {entry.clinic?.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {entry.clinic.address}
                        </span>
                      )}
                    </div>

                    <p className="text-sm mt-2">
                      <strong>{entry.pet_name}</strong> ({entry.pet_type})
                      {entry.reason && (
                        <span className="text-muted-foreground"> • {entry.reason}</span>
                      )}
                    </p>

                    {isNotified && entry.expires_at && (
                      <p className="text-xs text-primary mt-2 font-medium">
                        ⏰ Expires in {getTimeRemaining(entry.expires_at)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isNotified ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleBook(entry)}
                          disabled={actionLoading === entry.id}
                        >
                          {actionLoading === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Book
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(entry.id)}
                          disabled={actionLoading === entry.id}
                        >
                          Decline
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(entry.id)}
                        disabled={actionLoading === entry.id}
                      >
                        {actionLoading === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WaitlistSection;
