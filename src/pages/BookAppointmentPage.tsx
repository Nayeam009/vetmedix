import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const BookAppointmentPage = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '', time: '', petName: '', petType: '', reason: ''
  });

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert([{
        user_id: user.id, clinic_id: clinicId,
        appointment_date: formData.date, appointment_time: formData.time,
        pet_name: formData.petName, pet_type: formData.petType, reason: formData.reason
      }]);
      if (error) throw error;
      toast({ title: 'Appointment Booked!', description: 'You will receive a confirmation soon.' });
      navigate('/');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-display font-bold mb-6">Book Appointment</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div><Label>Time</Label>
                <select value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background" required>
                  <option value="">Select time</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Pet Name</Label>
              <Input value={formData.petName} onChange={(e) => setFormData({...formData, petName: e.target.value})} required />
            </div>
            <div><Label>Pet Type</Label>
              <select value={formData.petType} onChange={(e) => setFormData({...formData, petType: e.target.value})}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background" required>
                <option value="">Select type</option>
                <option value="Dog">Dog</option><option value="Cat">Cat</option>
                <option value="Bird">Bird</option><option value="Cattle">Cattle</option>
              </select>
            </div>
            <div><Label>Reason for Visit</Label>
              <textarea value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="w-full h-24 px-3 py-2 rounded-lg border border-border bg-background resize-none" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Booking'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookAppointmentPage;