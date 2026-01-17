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
            isAdmin={isAdmin}
            isClinicOwner={isClinicOwner}
            onAvatarUpdate={handleAvatarUpdate}
          />
        )}

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px] h-11 sm:h-12 p-1">
            <TabsTrigger value="profile" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="pets" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PawPrint className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Pets</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Appts</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Account Info
                  </CardTitle>
                  {!editing ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 sm:h-9">
                      <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-1 sm:gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="h-8 sm:h-9 px-2 sm:px-3">
                        <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 sm:h-9">
                        {saving ? <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                        <span className="hidden sm:inline">Save</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-2">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm sm:text-base text-foreground truncate">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Full Name</label>
                    {editing ? (
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value.slice(0, 100) })}
                        placeholder="Enter your full name"
                        maxLength={100}
                        className="h-9 sm:h-10 text-sm"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground">{profile?.full_name || 'Not set'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground">Phone</label>
                    {editing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.slice(0, 20) })}
                        placeholder="Enter your phone number"
                        maxLength={20}
                        className="h-9 sm:h-10 text-sm"
                      />
                    ) : (
                      <p className="text-sm sm:text-base text-foreground">{profile?.phone || 'Not set'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Saved Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Street Address</label>
                    {editing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value.slice(0, 500) })}
                        placeholder="Enter your address"
                        maxLength={500}
                      />
                    ) : (
                      <p className="text-foreground">{profile?.address || 'Not set'}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Division</label>
                      {editing ? (
                        <Select
                          value={formData.division}
                          onValueChange={(value) => setFormData({ ...formData, division: value, district: '', thana: '' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Division" />
                          </SelectTrigger>
                          <SelectContent>
                            {divisions.map((div) => (
                              <SelectItem key={div} value={div}>{div}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-foreground">{profile?.division || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">District</label>
                      {editing ? (
                        <Select
                          value={formData.district}
                          onValueChange={(value) => setFormData({ ...formData, district: value, thana: '' })}
                          disabled={!formData.division}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select District" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((dist) => (
                              <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-foreground">{profile?.district || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Thana</label>
                      {editing ? (
                        <Select
                          value={formData.thana}
                          onValueChange={(value) => setFormData({ ...formData, thana: value })}
                          disabled={!formData.district}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Thana" />
                          </SelectTrigger>
                          <SelectContent>
                            {thanas.map((thana) => (
                              <SelectItem key={thana} value={thana}>{thana}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-foreground">{profile?.thana || '-'}</p>
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
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                    <Button className="mt-4" onClick={() => navigate('/shop')}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
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
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Appointments
                </CardTitle>
                <Button onClick={() => navigate('/clinics')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Book New
                </Button>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No appointments scheduled</p>
                    <Button className="mt-4" onClick={() => navigate('/clinics')}>
                      Find a Clinic
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
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
