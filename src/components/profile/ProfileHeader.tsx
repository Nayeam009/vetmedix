import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Shield, PawPrint, ShoppingBag, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface ProfileHeaderProps {
  user: {
    id: string;
    email?: string;
    created_at?: string;
  };
  profile: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
  petsCount: number;
  ordersCount: number;
  isAdmin: boolean;
  onAvatarUpdate: (url: string) => void;
}

const ProfileHeader = ({ user, profile, petsCount, ordersCount, isAdmin, onAvatarUpdate }: ProfileHeaderProps) => {
  const { toast } = useToast();
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
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

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: Error) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-coral/10 p-6 md:p-8 mb-8">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-coral rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl">
            <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
            <AvatarFallback className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-primary to-accent text-white">
              {getInitials(profile?.full_name || null, user.email)}
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
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {profile?.full_name || 'Pet Parent'}
            </h1>
            {isAdmin && (
              <Badge variant="outline" className="w-fit mx-auto md:mx-0 border-primary text-primary">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mb-1">{user.email}</p>
          <p className="text-sm text-muted-foreground">
            Member since {user.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'recently'}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
              <PawPrint className="h-5 w-5 text-primary" />
              <span className="font-semibold">{petsCount}</span>
              <span className="text-muted-foreground text-sm">Pets</span>
            </div>
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
              <ShoppingBag className="h-5 w-5 text-coral" />
              <span className="font-semibold">{ordersCount}</span>
              <span className="text-muted-foreground text-sm">Orders</span>
            </div>
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
              <Heart className="h-5 w-5 text-accent" />
              <span className="text-muted-foreground text-sm">Pet Parent</span>
            </div>
          </div>
        </div>

        {/* Admin Button */}
        {isAdmin && (
          <Link to="/admin" className="hidden md:block">
            <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
