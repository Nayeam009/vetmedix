-- Create appointment waitlist table
CREATE TABLE public.appointment_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'booked', 'expired', 'cancelled')),
  notification_sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist" ON public.appointment_waitlist 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can join waitlist
CREATE POLICY "Users can join waitlist" ON public.appointment_waitlist 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own waitlist entry (cancel)
CREATE POLICY "Users can update own waitlist" ON public.appointment_waitlist 
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own waitlist entries
CREATE POLICY "Users can delete own waitlist" ON public.appointment_waitlist 
  FOR DELETE USING (auth.uid() = user_id);

-- Clinic owners can view waitlist for their clinic
CREATE POLICY "Clinic owners can view clinic waitlist" ON public.appointment_waitlist 
  FOR SELECT USING (is_clinic_owner(auth.uid(), clinic_id));

-- Clinic owners can update waitlist status
CREATE POLICY "Clinic owners can update clinic waitlist" ON public.appointment_waitlist 
  FOR UPDATE USING (is_clinic_owner(auth.uid(), clinic_id));

-- Create function to calculate waitlist position
CREATE OR REPLACE FUNCTION public.calculate_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := (
    SELECT COALESCE(MAX(position), 0) + 1
    FROM public.appointment_waitlist
    WHERE clinic_id = NEW.clinic_id
      AND preferred_date = NEW.preferred_date
      AND preferred_time = NEW.preferred_time
      AND status = 'waiting'
  );
  NEW.expires_at := NEW.preferred_date::timestamptz + interval '1 day';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for position calculation
CREATE TRIGGER set_waitlist_position
  BEFORE INSERT ON public.appointment_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_waitlist_position();

-- Create function to notify waitlist on appointment cancellation
CREATE OR REPLACE FUNCTION public.notify_waitlist_on_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  next_waitlist_id UUID;
  next_user_id UUID;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Find and update the first person in waitlist
    SELECT id, user_id INTO next_waitlist_id, next_user_id
    FROM public.appointment_waitlist
    WHERE clinic_id = NEW.clinic_id
      AND preferred_date = NEW.appointment_date
      AND preferred_time = NEW.appointment_time
      AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1;
    
    IF next_waitlist_id IS NOT NULL THEN
      -- Update waitlist entry status
      UPDATE public.appointment_waitlist
      SET status = 'notified',
          notification_sent_at = now(),
          expires_at = now() + interval '2 hours',
          updated_at = now()
      WHERE id = next_waitlist_id;
      
      -- Create notification for the user
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (
        next_user_id,
        'appointment',
        '🎉 Appointment Slot Available!',
        'A slot you were waiting for is now available! Book now before it expires in 2 hours.'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for appointment cancellation
CREATE TRIGGER appointment_cancelled_notify_waitlist
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_waitlist_on_cancellation();

-- Create function to update timestamps
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON public.appointment_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for waitlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_waitlist;