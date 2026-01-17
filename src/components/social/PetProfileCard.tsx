import { useState, useRef } from 'react';
import { Camera, MapPin, MessageCircle, Heart, Users, Edit2, Loader2, Grid3X3, UserPlus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Pet } from '@/types/social';

interface PetProfileCardProps {
  pet: Pet;
  postsCount: number;
  isOwner: boolean;
  onPetUpdate?: (updatedPet: Pet) => void;
}

export const PetProfileCard = ({ pet, postsCount, isOwner, onPetUpdate }: PetProfileCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, followersCount, followingCount, follow, unfollow } = useFollow(pet.id);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleFollowToggle = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isFollowing) {
      unfollow();
    } else {
      follow();
    }
  };

  const handleMessage = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data: existingConvo } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${pet.user_id}),and(participant_1_id.eq.${pet.user_id},participant_2_id.eq.${user.id})`)
        .maybeSingle();

      if (existingConvo) {
        navigate(`/chat/${existingConvo.id}`);
        return;
      }

      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          participant_1_id: user.id,
          participant_2_id: pet.user_id,
        })
        .select('id')
        .single();

      if (error) throw error;
      navigate(`/chat/${newConvo.id}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error starting conversation:', error);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/covers/${pet.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('pets')
        .update({ cover_photo_url: publicUrl })
        .eq('id', pet.id);

      if (updateError) throw updateError;

      onPetUpdate?.({ ...pet, cover_photo_url: publicUrl });
      toast.success('Cover photo updated!');
    } catch (error) {
      toast.error('Failed to update cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatars/${pet.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('pet-media')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('pets')
        .update({ avatar_url: publicUrl })
        .eq('id', pet.id);

      if (updateError) throw updateError;

      onPetUpdate?.({ ...pet, avatar_url: publicUrl });
      toast.success('Profile photo updated!');
    } catch (error) {
      toast.error('Failed to update profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="bg-card shadow-sm rounded-2xl overflow-hidden">
      {/* Cover Photo - Facebook Style */}
      <div className="relative h-[140px] xs:h-[180px] sm:h-[220px] md:h-[280px] bg-gradient-to-r from-primary/20 via-accent/20 to-lavender/20">
        {pet.cover_photo_url ? (
          <img 
            src={pet.cover_photo_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-lavender/30 overflow-hidden">
            <div className="absolute top-4 left-4 text-4xl opacity-20 animate-float">🐾</div>
            <div className="absolute top-12 right-8 text-3xl opacity-15 animate-float" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute bottom-8 left-1/3 text-2xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>💖</div>
          </div>
        )}
        
        {/* Cover Photo Edit Button */}
        {isOwner && (
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
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      {/* Profile Info Section */}
      <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          <div className="relative -mt-[60px] xs:-mt-[70px] sm:-mt-[80px] self-center sm:self-start">
            <div className="p-1 bg-card rounded-full shadow-lg">
              <Avatar className="h-[100px] w-[100px] xs:h-[120px] xs:w-[120px] sm:h-[140px] sm:w-[140px] border-4 border-card">
                <AvatarImage src={pet.avatar_url || ''} alt={pet.name} className="object-cover" />
                <AvatarFallback className="text-3xl xs:text-4xl sm:text-5xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                  {pet.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwner && (
              <>
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
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </>
            )}
          </div>

          {/* Name & Info */}
          <div className="flex-1 text-center sm:text-left sm:pb-2 min-w-0">
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight truncate">
              {pet.name}
            </h1>
            
            {/* Species & Breed Badges */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5 flex-wrap">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                {pet.species}
              </Badge>
              {pet.breed && (
                <Badge variant="outline" className="text-muted-foreground">
                  {pet.breed}
                </Badge>
              )}
              {pet.age && (
                <Badge variant="outline" className="text-muted-foreground">
                  {pet.age}
                </Badge>
              )}
            </div>

            {/* Followers Count - Facebook Style */}
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{followersCount}</span>
              <span>followers</span>
              <span className="mx-1">•</span>
              <span className="font-semibold text-foreground">{followingCount}</span>
              <span>following</span>
            </div>
            
            {/* Location */}
            {pet.location && (
              <p className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{pet.location}</span>
              </p>
            )}
          </div>

          {/* Action Buttons - Desktop */}
          <div className="hidden sm:flex items-center gap-2 pb-2">
            {isOwner ? (
              <Button 
                onClick={() => navigate(`/pets/${pet.id}/edit`)}
                className="gap-2 font-semibold"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button 
                  variant={isFollowing ? 'secondary' : 'default'}
                  onClick={handleFollowToggle}
                  className="gap-2 font-semibold min-w-[120px]"
                >
                  {isFollowing ? (
                    <>
                      <Heart className="h-4 w-4 fill-current" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleMessage}
                  className="gap-2 font-semibold"
                >
                  <MessageCircle className="h-4 w-4" />
                  Message
                </Button>
              </>
            )}
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bio */}
        {pet.bio && (
          <p className="mt-4 text-sm sm:text-base text-muted-foreground text-center sm:text-left leading-relaxed">
            {pet.bio}
          </p>
        )}

        {/* Mobile Action Buttons */}
        <div className="flex gap-2 mt-4 sm:hidden">
          {isOwner ? (
            <Button 
              onClick={() => navigate(`/pets/${pet.id}/edit`)}
              className="flex-1 gap-2 font-semibold h-10"
            >
              <Edit2 className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button 
                variant={isFollowing ? 'secondary' : 'default'}
                onClick={handleFollowToggle}
                className="flex-1 gap-2 font-semibold h-10"
              >
                {isFollowing ? (
                  <>
                    <Heart className="h-4 w-4 fill-current" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
              <Button 
                variant="secondary"
                onClick={handleMessage}
                className="flex-1 gap-2 font-semibold h-10"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
            </>
          )}
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 mt-4 sm:mt-5" />

        {/* Stats Row - Facebook Style */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">{postsCount}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-coral/10 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-coral" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">{followersCount}</span>
            <span className="text-xs text-muted-foreground">Followers</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-foreground">{followingCount}</span>
            <span className="text-xs text-muted-foreground">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
};
