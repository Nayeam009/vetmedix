import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader2, User, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { appointmentSchema } from '@/lib/validations';
import { useClinicDoctorsWithSchedules } from '@/hooks/useDoctorSchedules';

// Default time slots when no schedule is configured
const DEFAULT_TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

const BookAppointmentPage = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    date: '', time: '', petName: '', petType: '', reason: '', doctorId: ''
  });

  const { data: doctorsWithSchedules = [], isLoading: doctorsLoading } = useClinicDoctorsWithSchedules(clinicId || '');

  // Get available time slots based on selected doctor and date
  const getAvailableTimeSlots = (): string[] => {
    if (!formData.date) {
      return DEFAULT_TIME_SLOTS;
    }

    // If no doctor selected, show union of all doctors' available slots for that day, or default
    if (!formData.doctorId) {
      // Check if any doctor has schedules
      const allDoctorsHaveSchedules = doctorsWithSchedules.some((d: any) => d.schedules?.length > 0);
      if (!allDoctorsHaveSchedules) {
        return DEFAULT_TIME_SLOTS;
      }

      const selectedDate = new Date(formData.date);
      const dayOfWeek = selectedDate.getDay();
      
      // Get all unique available slots from all doctors
      const allSlots = new Set<string>();
      doctorsWithSchedules.forEach((doctor: any) => {
        if (doctor.schedules?.length > 0) {
          doctor.schedules
            .filter((s: any) => s.day_of_week === dayOfWeek && s.is_available)
            .forEach((s: any) => allSlots.add(s.start_time));
        }
      });

      return allSlots.size > 0 ? Array.from(allSlots).sort() : DEFAULT_TIME_SLOTS;
    }

    const selectedDoctor = doctorsWithSchedules.find((d: any) => d.id === formData.doctorId);
    if (!selectedDoctor?.schedules?.length) {
      // No schedule configured for this doctor, return default slots
      return DEFAULT_TIME_SLOTS;
    }

    const selectedDate = new Date(formData.date);
    const dayOfWeek = selectedDate.getDay();
    
    const daySchedules = selectedDoctor.schedules.filter(
      (s: any) => s.day_of_week === dayOfWeek && s.is_available
    );

    if (daySchedules.length === 0) return [];
    
    return daySchedules.map((s: any) => s.start_time).sort();
  };

  const availableTimeSlots = getAvailableTimeSlots();

  // Reset time when date or doctor changes
  useEffect(() => {
    if (formData.time && !availableTimeSlots.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [formData.date, formData.doctorId, availableTimeSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    
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
      const insertData: any = {
        user_id: user.id, 
        clinic_id: clinicId,
        appointment_date: validatedData.date, 
        appointment_time: validatedData.time,
        pet_name: validatedData.petName, 
        pet_type: validatedData.petType, 
        reason: validatedData.reason || ''
      };

      // Add doctor_id if selected
      if (formData.doctorId) {
        insertData.doctor_id = formData.doctorId;
      }

      const { error } = await supabase.from('appointments').insert([insertData]);
      if (error) throw error;
      toast({ title: 'Appointment Booked!', description: 'You will receive a confirmation soon.' });
      navigate('/');
    } catch (error: unknown) {
      toast({ title: 'Error', description: 'Failed to book appointment. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Get min date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Check if a date has available slots
  const isDateAvailable = (dateStr: string): boolean => {
    if (!formData.doctorId) return true;
    
    const selectedDoctor = doctorsWithSchedules.find((d: any) => d.id === formData.doctorId);
    if (!selectedDoctor?.schedules?.length) return true; // No schedule = use defaults

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    return selectedDoctor.schedules.some(
      (s: any) => s.day_of_week === dayOfWeek && s.is_available
    );
  };

  const selectedDoctorHasSchedule = formData.doctorId 
    ? doctorsWithSchedules.find((d: any) => d.id === formData.doctorId)?.schedules?.length > 0
    : false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-xl flex-1">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 sm:mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl sm:text-2xl">Book Appointment</CardTitle>
            <CardDescription className="text-sm">Fill in the details to schedule your visit</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Doctor Selection */}
              {doctorsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : doctorsWithSchedules.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Select Doctor (Optional)</Label>
                  <Select 
                    value={formData.doctorId || "any"} 
                    onValueChange={(value) => setFormData({...formData, doctorId: value === "any" ? "" : value, time: ''})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any available doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any available doctor</SelectItem>
                      {doctorsWithSchedules.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={doctor.avatar_url} />
                              <AvatarFallback>
                                <User className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span>{doctor.name}</span>
                            {doctor.specialization && (
                              <span className="text-muted-foreground text-xs">
                                ({doctor.specialization})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {formData.doctorId && selectedDoctorHasSchedule && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 text-xs sm:text-sm">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <p className="text-muted-foreground">
                        Time slots shown below are based on the doctor's availability schedule.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Date</Label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})} 
                    min={getMinDate()}
                    required 
                    className="w-full"
                  />
                  {formData.date && formData.doctorId && selectedDoctorHasSchedule && !isDateAvailable(formData.date) && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Doctor not available on this day
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Time</Label>
                  <Select 
                    value={formData.time} 
                    onValueChange={(value) => setFormData({...formData, time: value})}
                    disabled={availableTimeSlots.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={availableTimeSlots.length === 0 ? "No slots" : "Select time"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableTimeSlots.length === 0 && formData.date && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        No available slots for this date. Please choose a different date or doctor.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Pet Name */}
              <div className="space-y-2">
                <Label className="text-sm">Pet Name</Label>
                <Input 
                  value={formData.petName} 
                  onChange={(e) => setFormData({...formData, petName: e.target.value.slice(0, 100)})} 
                  maxLength={100}
                  placeholder="Enter your pet's name"
                  required 
                />
                {errors.petName && <p className="text-xs text-destructive">{errors.petName}</p>}
              </div>

              {/* Pet Type */}
              <div className="space-y-2">
                <Label className="text-sm">Pet Type</Label>
                <Select 
                  value={formData.petType} 
                  onValueChange={(value) => setFormData({...formData, petType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">Dog</SelectItem>
                    <SelectItem value="Cat">Cat</SelectItem>
                    <SelectItem value="Bird">Bird</SelectItem>
                    <SelectItem value="Cattle">Cattle</SelectItem>
                    <SelectItem value="Goat">Goat</SelectItem>
                    <SelectItem value="Sheep">Sheep</SelectItem>
                    <SelectItem value="Rabbit">Rabbit</SelectItem>
                    <SelectItem value="Fish">Fish</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-sm">Reason for Visit</Label>
                <textarea 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value.slice(0, 500)})}
                  maxLength={500}
                  placeholder="Describe the reason for your visit..."
                  className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background resize-none text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                />
                <p className="text-xs text-muted-foreground">{formData.reason.length}/500 characters</p>
                {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg" 
                disabled={loading || availableTimeSlots.length === 0}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default BookAppointmentPage;