import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Loader2, Camera, Building2, MapPin, Phone, Mail, Clock, CheckCircle, User, Calendar, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DoctorScheduleManager from '@/components/clinic/DoctorScheduleManager';
import { ClinicHeader } from '@/components/clinic/ClinicHeader';

const serviceCategories = [
  'General Checkup',
  'Vaccination',
  'Surgery',
  'Dental Care',
  'Grooming',
  'Emergency Care',
  'X-Ray & Imaging',
  'Laboratory Tests',
  'Pet Boarding',
  'Deworming',
  'Microchipping',
  'Spay/Neuter',
];

const ClinicProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { ownedClinic, clinicLoading, clinicDoctors, updateClinic } = useClinicOwner();

  // Get initial tab from URL params
  const initialTab = searchParams.get('tab') || 'clinic';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingClinicImage, setIsUploadingClinicImage] = useState(false);

  // Update tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['clinic', 'owner', 'schedules'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Clinic form data
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    opening_hours: '',
    is_open: true,
    services: [] as string[],
    distance: '',
  });

  // Owner profile data
  const [ownerData, setOwnerData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  });
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isSavingOwner, setIsSavingOwner] = useState(false);

  useEffect(() => {
    if (ownedClinic) {
      setFormData({
        name: ownedClinic.name || '',
        address: ownedClinic.address || '',
        phone: ownedClinic.phone || '',
        email: (ownedClinic as any).email || '',
        description: (ownedClinic as any).description || '',
        opening_hours: ownedClinic.opening_hours || '',
        is_open: ownedClinic.is_open ?? true,
        services: ownedClinic.services || [],
        distance: ownedClinic.distance || '',
      });
    }
  }, [ownedClinic]);

  // Fetch owner profile data
  useEffect(() => {
    const fetchOwnerProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setOwnerData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      }
    };
    fetchOwnerProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateClinic.mutate({
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      description: formData.description || null,
      opening_hours: formData.opening_hours || null,
      is_open: formData.is_open,
      services: formData.services.length > 0 ? formData.services : null,
      distance: formData.distance || null,
    } as any);
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleOwnerSave = async () => {
    if (!user) return;
    setIsSavingOwner(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: ownerData.full_name,
          phone: ownerData.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'Profile updated successfully' });
      setIsEditingOwner(false);
    } catch (error) {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    } finally {
      setIsSavingOwner(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      // Use user.id as folder for RLS policy compliance
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setOwnerData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: 'Avatar updated successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast({ title: 'Error uploading avatar', description: message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClinicImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ownedClinic?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploadingClinicImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      // Use clinic id as folder for RLS policy compliance
      const filePath = `${ownedClinic.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clinic-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-images')
        .getPublicUrl(filePath);

      // Update clinic with new image URL
      updateClinic.mutate({
        image_url: publicUrl,
      } as any, {
        onSuccess: () => {
          toast({ title: 'Clinic photo updated successfully' });
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast({ title: 'Error uploading clinic photo', description: message, variant: 'destructive' });
    } finally {
      setIsUploadingClinicImage(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  // Get doctors list for schedule manager
  const doctorsList = clinicDoctors?.map((cd: any) => ({
    id: cd.doctor?.id || cd.doctors?.id,
    name: cd.doctor?.name || cd.doctors?.name,
  })).filter((d: any) => d.id && d.name) || [];

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isClinicOwner) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClinicHeader />

      <main className="container mx-auto px-4 py-4 sm:py-6 max-w-3xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <ScrollArea className="w-full">
            <TabsList className="w-full inline-flex h-auto p-1 gap-1">
              <TabsTrigger value="clinic" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline">Clinic Details</span>
                <span className="xs:hidden">Clinic</span>
              </TabsTrigger>
              <TabsTrigger value="owner" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <User className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline">Owner Profile</span>
                <span className="xs:hidden">Owner</span>
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline">Doctor Schedules</span>
                <span className="xs:hidden">Schedules</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Clinic Details Tab */}
          <TabsContent value="clinic">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Clinic Photo & Status */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative shrink-0">
                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                        <AvatarImage src={ownedClinic?.image_url || ''} />
                        <AvatarFallback className="text-2xl">
                          <Building2 className="h-8 w-8 sm:h-10 sm:w-10" />
                        </AvatarFallback>
                      </Avatar>
                      <label
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                      >
                        {isUploadingClinicImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleClinicImageUpload}
                          disabled={isUploadingClinicImage}
                        />
                      </label>
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold truncate">{formData.name || 'My Clinic'}</h2>
                      <p className="text-muted-foreground text-sm truncate">{formData.address || 'Add your address'}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        {(ownedClinic as any)?.is_verified ? (
                          <Badge className="bg-emerald-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending Verification</Badge>
                        )}
                        <Badge variant={formData.is_open ? 'default' : 'secondary'}>
                          {formData.is_open ? 'Open' : 'Closed'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Basic Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your clinic's public details visible to pet owners</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Clinic Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Happy Paws Veterinary Clinic"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell pet owners about your clinic, specializations, facilities..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Location */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Contact & Location</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">How pet owners can reach and find your clinic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Full Address
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="House #, Road #, Area, City, Division"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="distance">Location Area (for search)</Label>
                    <Input
                      id="distance"
                      placeholder="e.g., Dhanmondi, Dhaka"
                      value={formData.distance}
                      onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+880 1XXX-XXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="clinic@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Offered */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Services Offered</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Select all services your clinic provides</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {serviceCategories.map((service) => (
                      <Badge
                        key={service}
                        variant={formData.services.includes(service) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors text-xs sm:text-sm py-1.5 px-3"
                        onClick={() => toggleService(service)}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3">
                    {formData.services.length} service(s) selected
                  </p>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Operating Hours</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">When is your clinic open for appointments?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-secondary/50">
                    <div>
                      <Label className="text-sm sm:text-base">Clinic Status</Label>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Show your clinic as currently open or closed
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_open}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Opening Hours
                    </Label>
                    <Input
                      id="hours"
                      placeholder="e.g., Sat-Thu: 9AM-8PM, Fri: 4PM-8PM"
                      value={formData.opening_hours}
                      onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Describe your typical operating schedule
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={updateClinic.isPending}
              >
                {updateClinic.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Clinic Profile
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Owner Profile Tab */}
          <TabsContent value="owner">
            <div className="space-y-4 sm:space-y-6">
              {/* Owner Avatar & Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative shrink-0">
                      <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
                        <AvatarImage src={ownerData.avatar_url} />
                        <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                          {getInitials(ownerData.full_name || user?.email || '')}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h2 className="text-xl sm:text-2xl font-bold truncate">{ownerData.full_name || 'Clinic Owner'}</h2>
                      <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        <Badge>
                          <Building2 className="h-3 w-3 mr-1" />
                          Clinic Owner
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/clinic/dashboard">
                            <Building2 className="h-4 w-4 mr-1.5" />
                            My Clinic
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader className="flex flex-row items-start sm:items-center justify-between gap-2 pb-4">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Your personal details for the clinic</CardDescription>
                  </div>
                  {!isEditingOwner ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditingOwner(true)}>
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingOwner(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleOwnerSave} disabled={isSavingOwner}>
                        {isSavingOwner ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      {isEditingOwner ? (
                        <Input
                          value={ownerData.full_name}
                          onChange={(e) => setOwnerData({ ...ownerData, full_name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-secondary/50 rounded-md">{ownerData.full_name || 'Not set'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      {isEditingOwner ? (
                        <Input
                          type="tel"
                          value={ownerData.phone}
                          onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
                          placeholder="+880 1XXX-XXXXXX"
                        />
                      ) : (
                        <p className="text-sm py-2 px-3 bg-secondary/50 rounded-md">{ownerData.phone || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clinic Association */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Clinic Details</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Your associated clinic information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-secondary/50">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                      <AvatarImage src={ownedClinic?.image_url || ''} />
                      <AvatarFallback>
                        <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h3 className="font-semibold truncate">{ownedClinic?.name || 'No clinic'}</h3>
                      <p className="text-sm text-muted-foreground truncate">{ownedClinic?.address || 'Address not set'}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                        {(ownedClinic as any)?.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {ownedClinic?.id && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                            <Link to={`/clinic/${ownedClinic.id}`}>View Public Page →</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border gap-1">
                    <span className="text-muted-foreground text-sm">Email</span>
                    <span className="text-sm truncate">{user?.email}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border gap-1">
                    <span className="text-muted-foreground text-sm">Role</span>
                    <Badge>Clinic Owner</Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1">
                    <span className="text-muted-foreground text-sm">Member Since</span>
                    <span className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Doctor Schedules Tab */}
          <TabsContent value="schedules">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg">Doctor Schedules</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Set available time slots for each doctor. Pet owners will only be able to book appointments during these times.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doctorsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No doctors found. Add doctors to your clinic first.</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link to="/clinic/doctors">Manage Doctors</Link>
                    </Button>
                  </div>
                ) : (
                  <DoctorScheduleManager
                    clinicId={ownedClinic?.id || ''}
                    doctors={doctorsList}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClinicProfile;