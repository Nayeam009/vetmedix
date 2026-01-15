import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { appointmentSchema } from '@/lib/validations';
import { useWaitlist } from '@/hooks/useWaitlist';
import JoinWaitlistDialog from '@/components/booking/JoinWaitlistDialog';
import WaitlistAlert from '@/components/booking/WaitlistAlert';

const MAX_APPOINTMENTS_PER_SLOT = 3; // Maximum appointments per time slot

interface SlotInfo {
  time: string;
  bookedCount: number;
  waitlistCount: number;
  isOnWaitlist: boolean;
}

const BookAppointmentPage = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { getSlotBookedCount, getSlotWaitlistCount, isUserOnWaitlist, userWaitlist } = useWaitlist();
  
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    date: '', time: '', petName: '', petType: '', reason: ''
  });
  const [clinicName, setClinicName] = useState('');
  const [slotInfos, setSlotInfos] = useState<SlotInfo[]>([]);
  const [waitlistDialogOpen, setWaitlistDialogOpen] = useState(false);
  const [selectedSlotForWaitlist, setSelectedSlotForWaitlist] = useState<SlotInfo | null>(null);

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  // Fetch clinic name
  useEffect(() => {
    const fetchClinic = async () => {
      if (!clinicId) return;
      const { data } = await supabase
        .from('clinics')
        .select('name')
        .eq('id', clinicId)
        .single();
      if (data) {
        setClinicName(data.name);
      }
    };
    fetchClinic();
  }, [clinicId]);

  // Fetch slot availability when date changes
  useEffect(() => {
    const fetchSlotAvailability = async () => {
      if (!formData.date || !clinicId) {
        setSlotInfos([]);
        return;
      }

      setSlotsLoading(true);
      try {
        const infos = await Promise.all(
          timeSlots.map(async (time) => {
            const [bookedCount, waitlistCount, onWaitlist] = await Promise.all([
              getSlotBookedCount(clinicId, formData.date, time),
              getSlotWaitlistCount(clinicId, formData.date, time),
              isUserOnWaitlist(clinicId, formData.date, time),
            ]);
            return {
              time,
              bookedCount,
              waitlistCount,
              isOnWaitlist: onWaitlist,
            };
          })
        );
        setSlotInfos(infos);
      } catch (error) {
        console.error('Error fetching slot availability:', error);
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchSlotAvailability();
  }, [formData.date, clinicId, userWaitlist]);

  const getSlotInfo = (time: string): SlotInfo | undefined => {
    return slotInfos.find((s) => s.time === time);
  };

  const isSlotFullyBooked = (time: string): boolean => {
    const info = getSlotInfo(time);
    return info ? info.bookedCount >= MAX_APPOINTMENTS_PER_SLOT : false;
  };

  const handleTimeSelect = (time: string) => {
    const slotInfo = getSlotInfo(time);
    
    if (slotInfo?.isOnWaitlist) {
      toast({
        title: 'Already on waitlist',
        description: 'You are already on the waitlist for this slot.',
      });
      return;
    }

    if (isSlotFullyBooked(time)) {
      // Open waitlist dialog
      setSelectedSlotForWaitlist(slotInfo || { time, bookedCount: MAX_APPOINTMENTS_PER_SLOT, waitlistCount: 0, isOnWaitlist: false });
      setWaitlistDialogOpen(true);
    } else {
      setFormData({ ...formData, time });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    
    // Check if slot is still available
    if (formData.time && isSlotFullyBooked(formData.time)) {
      toast({
        title: 'Slot no longer available',
        description: 'This slot has been booked. Please select another time or join the waitlist.',
        variant: 'destructive',
      });
      setFormData({ ...formData, time: '' });
      return;
    }
    
    // Validate form data
    const validationResult = appointmentSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({ title: 'Validation Error', description: 'Please check the form for errors.', variant: 'destructive' });
      return;
    }
    
    setErrors({});
    setLoading(true);
    try {
      const validatedData = validationResult.data;
      const { error } = await supabase.from('appointments').insert([{
        user_id: user.id, clinic_id: clinicId,
        appointment_date: validatedData.date, appointment_time: validatedData.time,
        pet_name: validatedData.petName, pet_type: validatedData.petType, reason: validatedData.reason || ''
      }]);
      if (error) throw error;
      toast({ title: 'Appointment Booked!', description: 'You will receive a confirmation soon.' });
      navigate('/profile');
    } catch (error: unknown) {
      toast({ title: 'Error', description: 'Failed to book appointment. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Get notified waitlist entries for this clinic
  const notifiedEntries = userWaitlist.filter(
    (e) => e.clinic_id === clinicId && e.status === 'notified'
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        {/* Waitlist notifications */}
        {notifiedEntries.map((entry) => (
          <WaitlistAlert key={entry.id} entry={entry} />
        ))}

        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-display font-bold mb-6">Book Appointment</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})} 
                min={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>

            {/* Time Slot Selection with availability */}
            <div>
              <Label>Select Time Slot</Label>
              {!formData.date ? (
                <p className="text-sm text-muted-foreground mt-2">Please select a date first</p>
              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {timeSlots.map((time) => {
                    const slotInfo = getSlotInfo(time);
                    const isBooked = isSlotFullyBooked(time);
                    const isSelected = formData.time === time;
                    const isOnWaitlist = slotInfo?.isOnWaitlist || false;

                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        disabled={isOnWaitlist}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary'
                            : isOnWaitlist
                            ? 'border-primary/30 bg-primary/5 cursor-not-allowed'
                            : isBooked
                            ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/50'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOnWaitlist ? (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                              On Waitlist
                            </Badge>
                          ) : isBooked ? (
                            <>
                              <Badge variant="destructive" className="text-xs">Full</Badge>
                              {slotInfo && slotInfo.waitlistCount > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {slotInfo.waitlistCount}
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                              {MAX_APPOINTMENTS_PER_SLOT - (slotInfo?.bookedCount || 0)} slots left
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {formData.time && (
                <p className="text-sm text-primary mt-2">
                  ✓ Selected: {formData.time}
                </p>
              )}
            </div>

            <div>
              <Label>Pet Name</Label>
              <Input 
                value={formData.petName} 
                onChange={(e) => setFormData({...formData, petName: e.target.value.slice(0, 100)})} 
                maxLength={100}
                required 
              />
              {errors.petName && <p className="text-sm text-destructive mt-1">{errors.petName}</p>}
            </div>
            <div>
              <Label>Pet Type</Label>
              <select value={formData.petType} onChange={(e) => setFormData({...formData, petType: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background" required>
                <option value="">Select type</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Cattle">Cattle</option>
              </select>
            </div>
            <div>
              <Label>Reason for Visit</Label>
              <textarea 
                value={formData.reason} 
                onChange={(e) => setFormData({...formData, reason: e.target.value.slice(0, 500)})}
                maxLength={500}
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background resize-none" 
              />
              <p className="text-xs text-muted-foreground mt-1">{formData.reason.length}/500 characters</p>
              {errors.reason && <p className="text-sm text-destructive mt-1">{errors.reason}</p>}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={loading || !formData.time}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />

      {/* Waitlist Dialog */}
      {selectedSlotForWaitlist && clinicId && (
        <JoinWaitlistDialog
          open={waitlistDialogOpen}
          onOpenChange={setWaitlistDialogOpen}
          clinicId={clinicId}
          clinicName={clinicName}
          date={formData.date}
          time={selectedSlotForWaitlist.time}
          waitlistCount={selectedSlotForWaitlist.waitlistCount}
        />
      )}
    </div>
  );
};

export default BookAppointmentPage;
