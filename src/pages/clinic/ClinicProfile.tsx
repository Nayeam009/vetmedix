import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Loader2, Camera, Building2, MapPin, 
  Phone, Mail, Clock, CheckCircle, ChevronLeft,
  Image as ImageIcon, Sparkles, X, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

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
    image_url: '',
    cover_photo_url: '',
  });

  useEffect(() => {
    if (ownedClinic) {
      setFormData({
        name: ownedClinic.name || '',
        address: ownedClinic.address || '',
        phone: ownedClinic.phone || '',
        email: ownedClinic.email || '',
        description: ownedClinic.description || '',
        opening_hours: ownedClinic.opening_hours || '',
        is_open: ownedClinic.is_open ?? true,
        services: ownedClinic.services || [],
        distance: ownedClinic.distance || '',
        image_url: ownedClinic.image_url || '',
        cover_photo_url: ownedClinic.cover_photo_url || '',
      });
    }
  }, [ownedClinic]);

  const uploadImage = async (file: File, type: 'avatar' | 'cover') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `clinic-${ownedClinic?.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `clinics/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clinic-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Try to create bucket if it doesn't exist
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          toast.error('Storage not configured. Please contact support.');
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('clinic-images')
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
        toast.success('Clinic photo updated!');
      } else {
        setFormData(prev => ({ ...prev, cover_photo_url: publicUrl }));
        toast.success('Cover photo updated!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], 'avatar');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0], 'cover');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Clinic name is required');
      return;
    }

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
      image_url: formData.image_url || null,
      cover_photo_url: formData.cover_photo_url || null,
    });
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50/30 via-background to-background pb-24 md:pb-8">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-xl h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0 active:scale-95 transition-transform"
            onClick={() => navigate('/clinic/dashboard')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground truncate">Edit Clinic Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Update your clinic's public information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Hero Section - Clinic Photo & Status Card */}
          <Card className="bg-white border-border/50 shadow-lg overflow-hidden">
            {/* Cover Photo with Enhanced Design */}
            <div 
              className={cn(
                "h-36 sm:h-48 relative bg-cover bg-center transition-all duration-300",
                !formData.cover_photo_url && "bg-gradient-to-br from-primary/30 via-orange-200/50 to-amber-100"
              )}
              style={formData.cover_photo_url ? { backgroundImage: `url(${formData.cover_photo_url})` } : undefined}
            >
              {/* Overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
              
              {/* Upload Prompt when no cover */}
              {!formData.cover_photo_url && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center mb-2 shadow-lg">
                    <ImageIcon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80">Add a cover photo</p>
                  <p className="text-xs text-muted-foreground">Recommended: 1200 x 400px</p>
                </div>
              )}
              
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
              
              {/* Cover Photo Button */}
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                className="absolute bottom-3 right-3 rounded-xl shadow-lg text-xs sm:text-sm h-9 px-3 bg-white/90 backdrop-blur-sm hover:bg-white active:scale-95 transition-all"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-1.5" />
                    {formData.cover_photo_url ? 'Change Cover' : 'Add Cover'}
                  </>
                )}
              </Button>

              {/* Quick Status Toggle - Top Right */}
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_open: !prev.is_open }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm transition-all active:scale-95",
                    formData.is_open 
                      ? "bg-emerald-500/90 text-white hover:bg-emerald-500" 
                      : "bg-red-500/90 text-white hover:bg-red-500"
                  )}
                >
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full animate-pulse",
                    formData.is_open ? "bg-white" : "bg-white/70"
                  )} />
                  <span className="text-sm font-semibold">
                    {formData.is_open ? 'Open' : 'Closed'}
                  </span>
                </button>
              </div>
            </div>
            
            {/* Avatar and Info Section */}
            <CardContent className="pt-0 -mt-14 sm:-mt-16 relative px-4 sm:px-6 pb-5 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                {/* Avatar with Upload */}
                <div className="relative flex-shrink-0 group">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="relative">
                    <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-white shadow-2xl ring-4 ring-primary/10">
                      <AvatarImage src={formData.image_url} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-primary via-orange-400 to-amber-400 text-white">
                        <Building2 className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    {/* Hover overlay */}
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 border-2 border-white"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                </div>
                
                {/* Clinic Info */}
                <div className="flex-1 text-center sm:text-left pb-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                    {formData.name || 'Your Clinic Name'}
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base truncate flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    {formData.address || 'Add your clinic address'}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                    {ownedClinic?.is_verified ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500 gap-1.5 text-xs px-3 py-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified Clinic
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs px-3 py-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Verification
                      </Badge>
                    )}
                    {formData.phone && (
                      <Badge variant="outline" className="text-muted-foreground text-xs px-3 py-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {formData.phone}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats / Status Bar */}
              <div className="mt-5 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        formData.is_open ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                      )} />
                      <span className="font-medium">
                        Status: <span className={formData.is_open ? "text-emerald-600" : "text-red-500"}>
                          {formData.is_open ? 'Currently Open' : 'Currently Closed'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_open: !prev.is_open }))}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all active:scale-95",
                      formData.is_open 
                        ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" 
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                    )}
                  >
                    {formData.is_open ? (
                      <>
                        <X className="h-4 w-4" />
                        Close Clinic
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Open Clinic
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your clinic's public details visible to pet owners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Clinic Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Happy Paws Veterinary Clinic"
                  className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell pet owners about your clinic, specializations, facilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="rounded-xl resize-none text-base sm:text-sm min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact & Location */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Contact & Location
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">How pet owners can reach and find your clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Full Address</Label>
                <Textarea
                  id="address"
                  placeholder="House #, Road #, Area, City, Division"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="rounded-xl resize-none text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance" className="text-sm font-medium">Location Area (for search)</Label>
                <Input
                  id="distance"
                  placeholder="e.g., Dhanmondi, Dhaka"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                  className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <Separator className="my-2" />

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="clinic@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Offered */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg">Services Offered</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Select all services your clinic provides</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map((service) => (
                  <button
                    type="button"
                    key={service}
                    onClick={() => toggleService(service)}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 touch-manipulation select-none",
                      formData.services.includes(service) 
                        ? 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90' 
                        : 'border-input bg-background hover:bg-primary/10 hover:border-primary/50'
                    )}
                  >
                    {formData.services.includes(service) && (
                      <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    )}
                    {service}
                  </button>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                <span className="font-semibold text-primary">{formData.services.length}</span> service(s) selected
              </p>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="bg-white border-border/50 shadow-sm">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Operating Hours
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">When is your clinic open for appointments?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6 pt-0">
              {/* Clinic Status Toggle */}
              <div 
                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 cursor-pointer active:scale-[0.99] transition-transform touch-manipulation"
                onClick={(e) => {
                  // Prevent double-toggle when clicking the Switch itself
                  if ((e.target as HTMLElement).closest('button[role="switch"]')) return;
                  setFormData(prev => ({ ...prev, is_open: !prev.is_open }));
                }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-sm sm:text-base font-medium cursor-pointer">Clinic Status</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formData.is_open ? 'Your clinic is visible as open' : 'Your clinic is visible as closed'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_open}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_open: checked }))}
                  className="scale-110"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours" className="text-sm font-medium">Opening Hours</Label>
                <Input
                  id="hours"
                  placeholder="e.g., Sat-Thu: 9AM-8PM, Fri: 4PM-8PM"
                  value={formData.opening_hours}
                  onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                  className="rounded-xl h-11 sm:h-10 text-base sm:text-sm"
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Describe your typical operating schedule
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button - Sticky on mobile */}
          <div className="sticky bottom-20 sm:bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 sm:bg-transparent sm:static">
            <Button 
              type="submit" 
              className="w-full rounded-xl shadow-lg shadow-primary/25 h-12 sm:h-11 text-base sm:text-sm active:scale-[0.98] transition-transform" 
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
          </div>
        </form>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default ClinicProfile;
