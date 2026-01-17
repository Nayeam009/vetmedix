import { useState, useRef } from 'react';
import { Camera, Loader2, Shield, PawPrint, ShoppingBag, Heart, Building2, Calendar, Settings, LogOut, Star, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileHeaderProps {
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
  profile: {
    full_name: string | null;
    avatar_url?: string | null;
    address?: string | null;
    division?: string | null;
  } | null;
  petsCount: number;
  ordersCount: number;
  appointmentsCount: number;
  isAdmin: boolean;
  isClinicOwner: boolean;
  onAvatarUpdate: (url: string) => void;
}

const ProfileHeader = ({ 
  user, 
  profile, 
  petsCount, 
  ordersCount, 
  appointmentsCount,
  isAdmin, 
  isClinicOwner, 
  onAvatarUpdate 
}: ProfileHeaderProps) => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
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

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast({ title: "Avatar updated", description: "Your profile picture has been updated successfully." });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload avatar";
      toast({ title: "Upload failed", description: errorMessage, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="relative mb-6">
      {/* Cover Background */}
      <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary via-primary/80 to-accent rounded-2xl sm:rounded-3xl overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white rounded-full blur-2xl" />
        </div>
      </div>

      {/* Profile Content */}
      <div className="relative px-4 sm:px-6 -mt-16 sm:-mt-20">
        <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative mx-auto sm:mx-0 -mt-16 sm:-mt-20">
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 border-white shadow-xl">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(profile?.full_name || null, user.email)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
                  {profile?.full_name || 'Pet Parent'}
                </h1>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {isAdmin && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isClinicOwner && (
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      <Building2 className="h-3 w-3 mr-1" />
                      Clinic Owner
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                    Pet Parent
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {user.created_at ? format(new Date(user.created_at), 'MMM yyyy') : 'recently'}
                </span>
                {profile?.division && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.division}
                  </span>
                )}
              </div>

              {/* Quick Stats - Mobile */}
              <div className="grid grid-cols-3 gap-2 mt-4 sm:hidden">
                <div className="bg-primary/5 rounded-xl p-3 text-center">
                  <PawPrint className="h-5 w-5 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{petsCount}</p>
                  <p className="text-xs text-muted-foreground">Pets</p>
                </div>
                <div className="bg-coral/5 rounded-xl p-3 text-center">
                  <ShoppingBag className="h-5 w-5 text-coral mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{ordersCount}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="bg-accent/5 rounded-xl p-3 text-center">
                  <Calendar className="h-5 w-5 text-accent mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{appointmentsCount}</p>
                  <p className="text-xs text-muted-foreground">Appts</p>
                </div>
              </div>
            </div>

            {/* Desktop Stats & Actions */}
            <div className="hidden sm:flex flex-col gap-3">
              {/* Stats */}
              <div className="flex gap-3">
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <p className="text-xl font-bold text-foreground">{petsCount}</p>
                  <p className="text-xs text-muted-foreground">Pets</p>
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <p className="text-xl font-bold text-foreground">{ordersCount}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <p className="text-xl font-bold text-foreground">{appointmentsCount}</p>
                  <p className="text-xs text-muted-foreground">Appts</p>
                </div>
              </div>
              
              {/* Desktop Action Buttons */}
              <div className="flex gap-2">
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="sm" className="gap-1.5">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                {isClinicOwner && (
                  <Link to="/clinic/dashboard">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Building2 className="h-4 w-4" />
                      My Clinic
                    </Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex gap-2 mt-4 sm:hidden">
            {isAdmin && (
              <Link to="/admin" className="flex-1">
                <Button size="sm" className="w-full gap-1.5">
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
            {isClinicOwner && (
              <Link to="/clinic/dashboard" className="flex-1">
                <Button size="sm" variant="outline" className="w-full gap-1.5">
                  <Building2 className="h-4 w-4" />
                  My Clinic
                </Button>
              </Link>
            )}
            <Button size="sm" variant="ghost" onClick={handleSignOut} className="text-muted-foreground px-3">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
