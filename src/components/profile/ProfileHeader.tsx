import { useState, useRef } from 'react';
import { Camera, Loader2, Shield, PawPrint, ShoppingBag, Building2, Calendar, LogOut, Star, MapPin, ImagePlus, Settings, Plus } from 'lucide-react';
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
    cover_photo_url?: string | null;
    address?: string | null;
    division?: string | null;
  } | null;
  petsCount: number;
  ordersCount: number;
  appointmentsCount: number;
  isAdmin: boolean;
  isClinicOwner: boolean;
  onAvatarUpdate: (url: string) => void;
  onCoverUpdate?: (url: string) => void;
}

const ProfileHeader = ({ 
  user, 
  profile, 
  petsCount, 
  ordersCount, 
  appointmentsCount,
  isAdmin, 
  isClinicOwner, 
  onAvatarUpdate,
  onCoverUpdate 
}: ProfileHeaderProps) => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingAvatar(true);
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
      toast({ title: "Profile picture updated" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload avatar";
      toast({ title: "Upload failed", description: errorMessage, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/cover.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onCoverUpdate?.(publicUrl);
      toast({ title: "Cover photo updated" });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload cover photo";
      toast({ title: "Upload failed", description: errorMessage, variant: "destructive" });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="bg-card shadow-sm rounded-b-2xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6">
      {/* Cover Photo - Facebook Style */}
      <div className="relative h-[140px] xs:h-[180px] sm:h-[220px] md:h-[280px] lg:h-[320px] bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10">
        {profile?.cover_photo_url ? (
          <img 
            src={profile.cover_photo_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-lavender/30">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white rounded-full blur-2xl" />
            </div>
          </div>
        )}
        
        {/* Cover Photo Upload Button - Facebook Style */}
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/90 hover:bg-white text-foreground text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all"
        >
          {uploadingCover ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Edit cover photo</span>
              <span className="sm:hidden">Edit</span>
            </>
          )}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
      </div>

      {/* Profile Info Section - Facebook Style */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        {/* Avatar - Overlapping Cover */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          <div className="relative -mt-[60px] xs:-mt-[70px] sm:-mt-[80px] md:-mt-[90px] self-center sm:self-start">
            <div className="p-1 bg-card rounded-full shadow-lg">
              <Avatar className="h-[100px] w-[100px] xs:h-[120px] xs:w-[120px] sm:h-[140px] sm:w-[140px] md:h-[160px] md:w-[160px] border-4 border-card">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} className="object-cover" />
                <AvatarFallback className="text-3xl xs:text-4xl sm:text-5xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {getInitials(profile?.full_name || null, user.email)}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-muted hover:bg-muted/80 border-2 border-card flex items-center justify-center shadow-md transition-colors"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Name & Info - Facebook Style */}
          <div className="flex-1 text-center sm:text-left sm:pb-2 min-w-0">
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {profile?.full_name || 'Pet Parent'}
            </h1>
            
            {/* Role Badges */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
              {isAdmin && (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {isClinicOwner && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                  <Building2 className="h-3 w-3 mr-1" />
                  Clinic Owner
                </Badge>
              )}
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                <Star className="h-3 w-3 mr-1 fill-amber-500" />
                Pet Parent
              </Badge>
            </div>

            {/* Friends/Followers Style Info */}
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{petsCount}</span>
              <span>pets</span>
              <span className="mx-1">•</span>
              <span className="font-semibold text-foreground">{ordersCount}</span>
              <span>orders</span>
              <span className="mx-1">•</span>
              <span className="font-semibold text-foreground">{appointmentsCount}</span>
              <span>appointments</span>
            </div>
            
            {/* Location & Join Date */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
              {profile?.division && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.division}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined {user.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'recently'}
              </span>
            </div>
          </div>

          {/* Action Buttons - Facebook Style - Desktop */}
          <div className="hidden sm:flex items-center gap-2 pb-2">
            <Link to="/pets/new">
              <Button className="gap-2 font-semibold">
                <Plus className="h-4 w-4" />
                Add Pet
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="secondary" className="gap-2 font-semibold">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
            {isClinicOwner && (
              <Link to="/clinic/dashboard">
                <Button variant="secondary" className="gap-2 font-semibold">
                  <Building2 className="h-4 w-4" />
                  My Clinic
                </Button>
              </Link>
            )}
            <Button variant="outline" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Action Buttons - Facebook Style */}
        <div className="flex gap-2 mt-4 sm:hidden">
          <Link to="/pets/new" className="flex-1">
            <Button className="w-full gap-2 font-semibold h-10">
              <Plus className="h-4 w-4" />
              Add Pet
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="flex-1">
              <Button variant="secondary" className="w-full gap-2 font-semibold h-10">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          )}
          {isClinicOwner && (
            <Link to="/clinic/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full gap-2 font-semibold h-10">
                <Building2 className="h-4 w-4" />
                Clinic
              </Button>
            </Link>
          )}
          <Button variant="outline" size="icon" onClick={handleSignOut} className="h-10 w-10 flex-shrink-0">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mt-4 sm:mt-5" />

        {/* Quick Stats Row - Facebook Style */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Link to="/pets/new" className="group">
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">{petsCount}</span>
              <span className="text-xs text-muted-foreground">Pets</span>
            </div>
          </Link>
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-coral/10 flex items-center justify-center mb-2">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-coral" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">{ordersCount}</span>
            <span className="text-xs text-muted-foreground">Orders</span>
          </div>
          <Link to="/clinics">
            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-foreground">{appointmentsCount}</span>
              <span className="text-xs text-muted-foreground">Appointments</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
