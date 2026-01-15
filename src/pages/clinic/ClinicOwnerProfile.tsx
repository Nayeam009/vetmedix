import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Shield, Camera, 
  Loader2, Building2, ArrowLeft, Save, Edit2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicOwner } from '@/hooks/useClinicOwner';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import logo from '@/assets/logo.jpeg';

const ClinicOwnerProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isClinicOwner, isLoading: roleLoading } = useUserRole();
  const { ownedClinic, clinicLoading } = useClinicOwner();
  const { toast } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<{
    full_name: string;
    phone: string;
    bio: string;
    avatar_url: string;
  }>({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: '',
  });

  // Fetch profile data
  useState(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          bio: '',
          avatar_url: data.avatar_url || '',
        });
      }
    };
    
    fetchProfile();
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: 'Success', description: 'Avatar updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated successfully' });
      setEditing(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (roleLoading || clinicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="VET-MEDIX" className="h-10 w-10 rounded-lg object-cover" />
              <span className="font-bold text-lg hidden sm:block">VET-MEDIX</span>
            </Link>
            <Badge variant="secondary" className="hidden sm:flex">
              <Building2 className="h-3 w-3 mr-1" />
              Clinic Owner
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/clinic/dashboard')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Profile Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 p-8 mb-8">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(profile.full_name || user?.email || 'U')}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {profile.full_name || 'Clinic Owner'}
              </h1>
              <p className="text-muted-foreground mb-1">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                <Badge variant="outline" className="border-primary text-primary">
                  <Shield className="h-3 w-3 mr-1" />
                  Clinic Owner
                </Badge>
                {ownedClinic && (
                  <Badge variant="secondary">
                    <Building2 className="h-3 w-3 mr-1" />
                    {ownedClinic.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Member since {user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'recently'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </div>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                {editing ? (
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-foreground font-medium">{profile.full_name || 'Not set'}</p>
                )}
              </div>
              
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="text-foreground">{user?.email}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                {editing ? (
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-foreground">{profile.phone || 'Not set'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clinic Association */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Clinic Details
              </CardTitle>
              <CardDescription>Your associated clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ownedClinic ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={ownedClinic.image_url || ''} />
                      <AvatarFallback>
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-lg">{ownedClinic.name}</p>
                      <p className="text-sm text-muted-foreground">{ownedClinic.address}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={ownedClinic.is_open ? 'default' : 'secondary'}>
                          {ownedClinic.is_open ? 'Open' : 'Closed'}
                        </Badge>
                        {ownedClinic.is_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 rounded-lg bg-primary/10">
                      <p className="text-2xl font-bold text-primary">{ownedClinic.rating || 0}</p>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-secondary">
                      <p className="text-2xl font-bold">{ownedClinic.services?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Services</p>
                    </div>
                  </div>

                  <Button asChild className="w-full mt-4">
                    <Link to="/clinic/profile">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Clinic Details
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No clinic associated</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Role</p>
                  <p className="font-semibold text-primary">Clinic Owner</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                  <p className="font-semibold">{user?.created_at ? format(new Date(user.created_at), 'PP') : '-'}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClinicOwnerProfile;