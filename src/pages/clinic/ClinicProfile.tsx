import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Camera, Building2, MapPin, Phone, Mail, Clock, Globe, CheckCircle } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import logo from '@/assets/logo.jpeg';

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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/clinic/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="VET-MEDIX" className="h-10 w-10 rounded-lg object-cover" />
              <span className="font-bold text-lg hidden sm:block">VET-MEDIX</span>
            </Link>
          </div>
          <Badge variant="secondary">
            <Building2 className="h-3 w-3 mr-1" />
            Clinic Settings
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clinic Photo & Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={ownedClinic?.image_url || ''} />
                    <AvatarFallback className="text-2xl">
                      <Building2 className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{formData.name || 'My Clinic'}</h2>
                  <p className="text-muted-foreground">{formData.address || 'Add your address'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {(ownedClinic as any)?.is_verified ? (
                      <Badge className="bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Clinic
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
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
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
            <CardHeader>
              <CardTitle>Contact & Location</CardTitle>
              <CardDescription>How pet owners can reach and find your clinic</CardDescription>
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
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Select all services your clinic provides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map((service) => (
                  <Badge
                    key={service}
                    variant={formData.services.includes(service) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleService(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {formData.services.length} service(s) selected
              </p>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>When is your clinic open for appointments?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <Label className="text-base">Clinic Status</Label>
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
                <p className="text-sm text-muted-foreground">
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
      </main>
    </div>
  );
};

export default ClinicProfile;