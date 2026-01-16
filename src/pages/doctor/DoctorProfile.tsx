import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Camera, Stethoscope } from 'lucide-react';
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
import { toast } from 'sonner';
import logo from '@/assets/logo.jpeg';

const DoctorProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDoctor, isLoading: roleLoading } = useUserRole();
  const { doctorProfile, profileLoading, updateProfile } = useDoctor();

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
      });
    }
  }, [doctorProfile]);

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
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={doctorProfile?.avatar_url || ''} />
                    <AvatarFallback className="text-2xl">
                      {formData.name.charAt(0) || 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{formData.name || 'Doctor Profile'}</h2>
                  <p className="text-muted-foreground">{formData.specialization || 'Veterinary Doctor'}</p>
                  {doctorProfile?.is_verified && (
                    <Badge className="mt-2" variant="default">Verified</Badge>
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
