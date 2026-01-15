import { useState } from 'react';
import { Plus, Trash2, Copy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DoctorScheduleManagerProps {
  clinicId: string;
  doctors: Array<{ id: string; name: string }>;
}

interface Schedule {
  id: string;
  doctor_id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_available: boolean;
  max_appointments: number;
}

const DAYS_OF_WEEK = [
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
];

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM'
];

const DoctorScheduleManager = ({ clinicId, doctors }: DoctorScheduleManagerProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['doctor-schedules', clinicId, selectedDoctor],
    queryFn: async () => {
      if (!selectedDoctor) return [];
      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('doctor_id', selectedDoctor)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data as Schedule[];
    },
    enabled: !!selectedDoctor,
  });

  const addSlotMutation = useMutation({
    mutationFn: async (slot: Omit<Schedule, 'id'>) => {
      const { error } = await supabase.from('doctor_schedules').insert([slot]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
      toast({ title: 'Time slot added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase.from('doctor_schedules').delete().eq('id', slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
      toast({ title: 'Time slot removed' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ slotId, isAvailable }: { slotId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from('doctor_schedules')
        .update({ is_available: isAvailable })
        .eq('id', slotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const copyScheduleMutation = useMutation({
    mutationFn: async (targetDoctorId: string) => {
      if (!selectedDoctor || selectedDoctor === targetDoctorId) return;
      
      // Delete existing schedules for target doctor
      await supabase
        .from('doctor_schedules')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('doctor_id', targetDoctorId);

      // Copy schedules
      const newSchedules = schedules.map(s => ({
        doctor_id: targetDoctorId,
        clinic_id: clinicId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes,
        is_available: s.is_available,
        max_appointments: s.max_appointments,
      }));

      if (newSchedules.length > 0) {
        const { error } = await supabase.from('doctor_schedules').insert(newSchedules);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] });
      toast({ title: 'Schedule copied successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddSlot = (dayOfWeek: number, startTime: string) => {
    if (!selectedDoctor) return;

    // Calculate end time (30 min later)
    const timeIndex = TIME_SLOTS.indexOf(startTime);
    const endTime = TIME_SLOTS[timeIndex + 1] || startTime;

    addSlotMutation.mutate({
      doctor_id: selectedDoctor,
      clinic_id: clinicId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      slot_duration_minutes: 30,
      is_available: true,
      max_appointments: 1,
    });
  };

  const getScheduleForSlot = (dayOfWeek: number, startTime: string) => {
    return schedules.find(s => s.day_of_week === dayOfWeek && s.start_time === startTime);
  };

  const groupedSchedules = DAYS_OF_WEEK.map(day => ({
    ...day,
    slots: schedules.filter(s => s.day_of_week === day.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="w-full sm:w-64">
          <Label className="mb-2 block">Select Doctor</Label>
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map(doctor => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDoctor && doctors.length > 1 && (
          <Select onValueChange={(value) => copyScheduleMutation.mutate(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Copy className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Copy to doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors
                .filter(d => d.id !== selectedDoctor)
                .map(doctor => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedDoctor ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a doctor to manage their schedule</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {groupedSchedules.map(day => (
            <Card key={day.value}>
              <CardHeader className="py-3">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                  <span>{day.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {day.slots.length} slots
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                {day.slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-3">No slots configured</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {day.slots.map(slot => (
                      <div
                        key={slot.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
                          slot.is_available
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted border-border text-muted-foreground line-through'
                        }`}
                      >
                        <span>{slot.start_time}</span>
                        <Switch
                          checked={slot.is_available}
                          onCheckedChange={(checked) =>
                            toggleAvailabilityMutation.mutate({ slotId: slot.id, isAvailable: checked })
                          }
                          className="h-4 w-7"
                        />
                        <button
                          onClick={() => deleteSlotMutation.mutate(slot.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Select onValueChange={(time) => handleAddSlot(day.value, time)}>
                  <SelectTrigger className="w-40">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add Slot</span>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.filter(time => !getScheduleForSlot(day.value, time)).map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorScheduleManager;
