import { useState, useRef } from 'react';
import { Camera, Settings, MapPin, MessageCircle, Heart, Sparkles, Users, Edit2, ImagePlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

    // Check file size (5MB limit for images)
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

    // Check file size (5MB limit for images)
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
    <Card className="overflow-hidden border-0 shadow-lg rounded-2xl sm:rounded-3xl animate-fade-in bg-card">
      {/* Cover Photo */}
      <div className="relative h-32 xs:h-40 sm:h-52 md:h-60 bg-gradient-to-br from-primary/30 via-accent/20 to-lavender/30 overflow-hidden">
        {pet.cover_photo_url ? (
          <img 
            src={pet.cover_photo_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 text-3xl sm:text-4xl opacity-30 animate-float">🐾</div>
            <div className="absolute top-8 right-6 sm:top-12 sm:right-8 text-2xl sm:text-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute bottom-6 left-1/3 sm:bottom-8 text-xl sm:text-2xl opacity-25 animate-float" style={{ animationDelay: '2s' }}>💖</div>
            <div className="absolute top-1/2 right-1/4 text-2xl sm:text-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }}>🐾</div>
          </div>
        )}
        
        {/* Cover Photo Edit Button */}
        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 h-8 sm:h-10 gap-1.5 rounded-full bg-card/90 backdrop-blur hover:bg-card shadow-lg text-xs sm:text-sm"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Edit Cover</span>
              </>
            )}
          </Button>
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverUpload}
        />
      </div>

      <CardContent className="relative pt-0 px-3 sm:px-6 pb-4 sm:pb-6">
        {/* Avatar and Info Section */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-16 md:-mt-20">
          {/* Avatar */}
          <div className="relative self-start sm:self-auto">
            <div className="p-0.5 sm:p-1 rounded-full bg-gradient-to-br from-primary via-accent to-lavender shadow-glow">
              <Avatar className="h-20 w-20 xs:h-24 xs:w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 border-3 sm:border-4 border-card">
                <AvatarImage src={pet.avatar_url || ''} alt={pet.name} className="object-cover" />
                <AvatarFallback className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                  {pet.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwner && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 sm:bottom-1 sm:right-1 h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-card shadow-lg border border-border"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </Button>
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

          {/* Name & Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0 pt-2 sm:pt-0 sm:pb-2">
            <div className="min-w-0">
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-display font-bold flex items-center gap-2 truncate">
                <span className="truncate">{pet.name}</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-sunshine flex-shrink-0" />
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px] xs:text-xs font-medium">
                  {pet.species}
                </Badge>
                {pet.breed && (
                  <Badge variant="outline" className="text-[10px] xs:text-xs text-primary border-primary/30">
                    {pet.breed}
                  </Badge>
                )}
                {pet.age && (
                  <span className="text-[10px] xs:text-xs text-muted-foreground">• {pet.age}</span>
                )}
              </div>
              {pet.location && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-1.5">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                  <span className="truncate">{pet.location}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {isOwner ? (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                  className="rounded-xl border-2 font-semibold hover:bg-primary/5 hover:border-primary hover:text-primary h-9 sm:h-10 text-xs sm:text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button 
                    variant={isFollowing ? 'outline' : 'default'}
                    size="sm"
                    onClick={handleFollowToggle}
                    className={`rounded-xl font-semibold min-w-[80px] sm:min-w-[100px] h-9 sm:h-10 text-xs sm:text-sm ${
                      isFollowing 
                        ? 'border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive' 
                        : 'btn-primary'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 fill-current" />
                        <span className="hidden xs:inline">Following</span>
                        <span className="xs:hidden">✓</span>
                      </>
                    ) : (
                      <>
                        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={handleMessage}
                    title="Send message"
                    className="rounded-xl border-2 hover:bg-sky/10 hover:border-sky hover:text-sky h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                  >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {pet.bio && (
          <p className="mt-4 sm:mt-5 text-xs sm:text-sm leading-relaxed bg-muted/50 p-3 sm:p-4 rounded-xl">{pet.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-border/50">
          {[
            { value: postsCount, label: 'Posts', icon: Sparkles, color: 'from-primary to-coral-dark' },
            { value: followersCount, label: 'Followers', icon: Users, color: 'from-accent to-mint' },
            { value: followingCount, label: 'Following', icon: Heart, color: 'from-lavender to-sky' },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="text-center p-2 sm:p-3 md:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-transparent hover:from-muted hover:to-muted/50 transition-all duration-300 cursor-default group"
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1.5 sm:mb-2 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
