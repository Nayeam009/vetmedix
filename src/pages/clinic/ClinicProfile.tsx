import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Camera, Building2, MapPin, 
  Phone, Mail, Clock, Globe, CheckCircle, ChevronLeft,
  Image as ImageIcon, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';

const divisions = [
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

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
  const { user } = useAuth();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { ownedClinic, clinicLoading, updateClinic } = useClinicOwner();

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

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/30 via-background to-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !isClinicOwner) {
    navigate(user ? '/' : '/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl"
            onClick={() => navigate('/clinic/dashboard')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Edit Clinic Profile</h1>
            <p className="text-sm text-muted-foreground">Update your clinic's public information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clinic Photo & Status */}
          <Card className="bg-white border-border/50 shadow-sm overflow-hidden">
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-orange-100 to-amber-50 relative">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                className="absolute bottom-3 right-3 rounded-lg shadow-md"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Change Cover
              </Button>
            </div>
            <CardContent className="pt-0 -mt-12 sm:-mt-16 relative">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white shadow-xl">
                    <AvatarImage src={ownedClinic?.image_url || ''} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-orange-400 text-white">
                      <Building2 className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">{formData.name || 'My Clinic'}</h2>
                  <p className="text-muted-foreground text-sm">{formData.address || 'Add your address'}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(ownedClinic as any)?.is_verified ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified Clinic
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        Pending Verification
                      </Badge>
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
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>Your clinic's public details visible to pet owners</CardDescription>
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
                  className="rounded-xl"
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
                  className="rounded-xl resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Contact & Location
              </CardTitle>
              <CardDescription>How pet owners can reach and find your clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="House #, Road #, Area, City, Division"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Location Area (for search)</Label>
                <Input
                  id="distance"
                  placeholder="e.g., Dhanmondi, Dhaka"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="clinic@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Offered */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Services Offered</CardTitle>
              <CardDescription>Select all services your clinic provides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {serviceCategories.map((service) => (
                  <Badge
                    key={service}
                    variant={formData.services.includes(service) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all active:scale-95 py-2 sm:py-1.5 px-3 sm:px-2.5 text-xs sm:text-sm ${
                      formData.services.includes(service) 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'hover:bg-primary/10 hover:border-primary/50'
                    }`}
                    onClick={() => toggleService(service)}
                  >
                    {formData.services.includes(service) && <CheckCircle className="h-3 w-3 mr-1" />}
                    {service}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                <span className="font-medium text-primary">{formData.services.length}</span> service(s) selected
              </p>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Operating Hours
              </CardTitle>
              <CardDescription>When is your clinic open for appointments?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                <div>
                  <Label className="text-base font-medium">Clinic Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your clinic as currently open or closed
                  </p>
                </div>
                <Switch
                  checked={formData.is_open}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_open: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Opening Hours</Label>
                <Input
                  id="hours"
                  placeholder="e.g., Sat-Thu: 9AM-8PM, Fri: 4PM-8PM"
                  value={formData.opening_hours}
                  onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                  className="rounded-xl"
                />
                <p className="text-sm text-muted-foreground">
                  Describe your typical operating schedule
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full rounded-xl shadow-lg shadow-primary/25" 
            size="lg"
            disabled={updateClinic.isPending}
          >
            {updateClinic.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Clinic Profile
              </>
            )}
          </Button>
        </form>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicProfile;
