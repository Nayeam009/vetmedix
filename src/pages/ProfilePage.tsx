import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, ShoppingBag, Calendar, Edit2, Save, X, Loader2, Package, PawPrint, Plus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { profileSchema } from '@/lib/validations';
import { getDivisions, getDistricts, getThanas } from '@/lib/bangladeshRegions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import MyPetsSection from '@/components/profile/MyPetsSection';
import OrderCard from '@/components/profile/OrderCard';
import AppointmentCard from '@/components/profile/AppointmentCard';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  avatar_url?: string | null;
}

interface Order {
  id: string;
  items: any;
  total_amount: number;
  status: string;
  shipping_address: string | null;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: string;
  clinic_id: string;
  clinic?: {
    name: string;
    address: string | null;
    phone: string | null;
  };
}

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { pets, loading: petsLoading } = usePets();
  const { isAdmin } = useAdmin();
  const { isClinicOwner } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    division: '',
    district: '',
    thana: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          division: profileData.division || '',
          district: profileData.district || '',
          thana: profileData.thana || '',
        });
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          clinic:clinics(name, address, phone)
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      setAppointments(appointmentsData as any || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    const validationResult = profileSchema.safeParse(formData);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(err => err.message).join(', ');
      toast({
        title: "Validation Error",
        description: errorMessages,
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const validatedData = validationResult.data;
      const { error } = await supabase
        .from('profiles')
        .update(validatedData)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...validatedData });
      setEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const divisions = getDivisions();
  const districts = formData.division ? getDistricts(formData.division) : [];
  const thanas = formData.division && formData.district ? getThanas(formData.division, formData.district) : [];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Profile Header */}
        {user && (
          <ProfileHeader
            user={{ id: user.id, email: user.email, created_at: user.created_at }}
            profile={profile}
            petsCount={pets.length}
            ordersCount={orders.length}
            appointmentsCount={appointments.length}
            isAdmin={isAdmin}
            isClinicOwner={isClinicOwner}
            onAvatarUpdate={handleAvatarUpdate}
          />
        )}

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full bg-white border border-border/50 rounded-xl p-1 h-auto grid grid-cols-4 gap-1">
            <TabsTrigger 
              value="profile" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 sm:h-4 sm:w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pets" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <PawPrint className="h-4 w-4 sm:h-4 sm:w-4" />
              <span>Pets</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <ShoppingBag className="h-4 w-4 sm:h-4 sm:w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="appointments" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2.5 px-2 sm:px-4 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Appts</span>
              <span className="xs:hidden">Appt</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              <Card className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-3 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    Account Info
                  </CardTitle>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="h-8 sm:h-9 gap-1.5">
                      <Edit2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8 sm:h-9 px-2.5">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 sm:h-9 gap-1.5">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        <span className="hidden sm:inline">Save</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
                    <p className="text-sm sm:text-base text-foreground font-medium truncate">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                    {editing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value.slice(0, 100) })}
                        placeholder="Enter your full name"
                        maxLength={100}
                        className="h-10 text-sm"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground font-medium">{profile?.full_name || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</label>
                    {editing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 20) })}
                        placeholder="Enter your phone number"
                        maxLength={20}
                        className="h-10 text-sm"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground font-medium">{profile?.phone || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 sm:p-6 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-accent" />
                    </div>
                    Saved Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Street Address</label>
                    {editing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 500) })}
                        placeholder="Enter your address"
                        maxLength={500}
                        className="h-10"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground font-medium">{profile?.address || <span className="text-muted-foreground italic">Not set</span>}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Division</label>
                      {editing ? (
                        <Select
                          value={formData.division}
                          onValueChange={(value) => setFormData({ ...formData, division: value, district: '', thana: '' })}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map((div) => (
                              <SelectItem key={div} value={div}>{div}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm sm:text-base text-foreground font-medium">{profile?.division || <span className="text-muted-foreground">-</span>}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">District</label>
                      {editing ? (
                        <Select
                          value={formData.district}
                          onValueChange={(value) => setFormData({ ...formData, district: value, thana: '' })}
                          disabled={!formData.division}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((dist) => (
                              <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm sm:text-base text-foreground font-medium">{profile?.district || <span className="text-muted-foreground">-</span>}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thana</label>
                      {editing ? (
                        <Select
                          value={formData.thana}
                          onValueChange={(value) => setFormData({ ...formData, thana: value })}
                          disabled={!formData.district}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select Thana" />
                          </SelectTrigger>
                          <SelectContent>
                            {thanas.map((thana) => (
                              <SelectItem key={thana} value={thana}>{thana}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm sm:text-base text-foreground font-medium">{profile?.thana || <span className="text-muted-foreground">-</span>}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Pets Tab */}
          <TabsContent value="pets">
            <MyPetsSection pets={pets} loading={petsLoading} />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="bg-muted/30 p-4 sm:p-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-8 w-8 rounded-lg bg-coral/10 flex items-center justify-center">
                    <Package className="h-4 w-4 text-coral" />
                  </div>
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">No orders yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here</p>
                    <Button onClick={() => navigate('/shop')} className="gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {orders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card className="shadow-sm border-border/50 overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-4 sm:p-6 pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  My Appointments
                </CardTitle>
                <Button onClick={() => navigate('/clinics')} className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Book New
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">No appointments scheduled</h3>
                    <p className="text-sm text-muted-foreground mb-4">Book an appointment at a nearby clinic</p>
                    <Button onClick={() => navigate('/clinics')} className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Find a Clinic
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {appointments.map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default ProfilePage;
