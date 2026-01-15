import { useState } from 'react';
import { Clock, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWaitlist, JoinWaitlistParams } from '@/hooks/useWaitlist';

interface JoinWaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  clinicName: string;
  date: string;
  time: string;
  waitlistCount: number;
  onSuccess?: () => void;
}

const JoinWaitlistDialog = ({
  open,
  onOpenChange,
  clinicId,
  clinicName,
  date,
  time,
  waitlistCount,
  onSuccess,
}: JoinWaitlistDialogProps) => {
  const { joinWaitlist } = useWaitlist();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    petName: '',
    petType: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.petName || !formData.petType) {
      return;
    }

    setLoading(true);
    const params: JoinWaitlistParams = {
      clinicId,
      preferredDate: date,
      preferredTime: time,
      petName: formData.petName,
      petType: formData.petType,
      reason: formData.reason || undefined,
    };

    const success = await joinWaitlist(params);
    setLoading(false);

    if (success) {
      setFormData({ petName: '', petType: '', reason: '' });
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Waitlist</DialogTitle>
          <DialogDescription>
            This time slot is currently fully booked. Join the waitlist and we'll notify you when a slot opens up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slot Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-medium">{clinicName}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {time}
              </span>
            </div>
          </div>

          {/* Position Estimate */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {waitlistCount > 0 ? (
                <>You will be position <strong>#{waitlistCount + 1}</strong> in the queue.</>
              ) : (
                <>You will be <strong>first in line</strong> when a slot opens!</>
              )}
            </AlertDescription>
          </Alert>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="petName">Pet Name *</Label>
              <Input
                id="petName"
                value={formData.petName}
                onChange={(e) => setFormData({ ...formData, petName: e.target.value.slice(0, 100) })}
                placeholder="Enter your pet's name"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="petType">Pet Type *</Label>
              <select
                id="petType"
                value={formData.petType}
                onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                required
              >
                <option value="">Select type</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Cattle">Cattle</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit (Optional)</Label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value.slice(0, 500) })}
                placeholder="Briefly describe why you need this appointment"
                maxLength={500}
                className="w-full h-20 px-3 py-2 rounded-lg border border-border bg-background resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">{formData.reason.length}/500 characters</p>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.petName || !formData.petType}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Waitlist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinWaitlistDialog;
