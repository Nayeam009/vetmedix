import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Camera, Stethoscope, ExternalLink, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import MobileNav from '@/components/MobileNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctor } from '@/hooks/useDoctor';
import { useUserRole } from '@/hooks/useUserRole';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.jpeg';

const COMMON_QUALIFICATIONS = [
  'DVM', 'BVSc', 'MVSc', 'PhD', 'DACVS', 'DACVIM', 'DECVS', 'MRCVS'
];

const DoctorProfile = () => {
  useDocumentTitle('Edit Profile');
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const { doctorProfile, profileLoading, updateProfile } = useDoctor();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newQualification, setNewQualification] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    bio: '',
    phone: '',
    email: '',
    license_number: '',
    experience_years: '',
    consultation_fee: '',
    is_available: true,
    qualifications: [] as string[],
  });

  useEffect(() => {
    if (doctorProfile) {
      setFormData({
        name: doctorProfile.name || '',
        specialization: doctorProfile.specialization || '',
        bio: doctorProfile.bio || '',
        phone: doctorProfile.phone || '',
        email: doctorProfile.email || '',
        license_number: doctorProfile.license_number || '',
        experience_years: doctorProfile.experience_years?.toString() || '',
        consultation_fee: doctorProfile.consultation_fee?.toString() || '',
        is_available: doctorProfile.is_available ?? true,
        qualifications: doctorProfile.qualifications || [],
      });
    }
  }, [doctorProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !doctorProfile?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `doctors/${doctorProfile.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const addQualification = (qual: string) => {
    if (qual && !formData.qualifications.includes(qual)) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qual]
      }));
    }
    setNewQualification('');
  };

  const removeQualification = (qual: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qual)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfile.mutate({
      name: formData.name,
      specialization: formData.specialization || null,
      bio: formData.bio || null,
      phone: formData.phone || null,
      email: formData.email || null,
      license_number: formData.license_number || null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
      is_available: formData.is_available,
      qualifications: formData.qualifications.length > 0 ? formData.qualifications : null,
    });
  };

  if (roleLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isDoctor) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
        {/* Back to Dashboard */}
        <Button variant="ghost" size="sm" className="mb-3 gap-1.5 -ml-1" onClick={() => navigate('/doctor/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardContent className="pt-5 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                    <AvatarImage src={doctorProfile?.avatar_url || ''} />
                    <AvatarFallback className="text-xl sm:text-2xl">
                      {formData.name.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
                    aria-label="Upload profile photo"
                  >
                    {avatarUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                    <h2 className="text-lg sm:text-xl font-semibold truncate">{formData.name || 'Doctor Profile'}</h2>
                    {doctorProfile?.is_verified && (
                      <Badge variant="default" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{formData.specialization || 'Veterinary Doctor'}</p>
                  {doctorProfile?.id && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto mt-1.5 text-xs" 
                      onClick={() => navigate(`/doctor/${doctorProfile.id}`)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Public Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your professional details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Small Animals, Surgery"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell patients about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qualifications */}
          <Card>
            <CardHeader>
              <CardTitle>Qualifications</CardTitle>
              <CardDescription>Add your degrees and certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual) => (
                  <Badge key={qual} variant="secondary" className="text-sm px-3 py-1.5 gap-1">
                    {qual}
                    <button
                      type="button"
                      onClick={() => removeQualification(qual)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${qual}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Common Qualifications</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_QUALIFICATIONS.filter(q => !formData.qualifications.includes(q)).map((qual) => (
                    <Button
                      key={qual}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQualification(qual)}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {qual}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom qualification..."
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQualification(newQualification);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addQualification(newQualification)}
                  disabled={!newQualification}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability & Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Availability & Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Available for Appointments</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle off when you're unavailable
                  </p>
                </div>
                <Switch
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee">Consultation Fee (BDT)</Label>
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  placeholder="500"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default DoctorProfile;
