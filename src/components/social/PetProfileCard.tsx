import { useState } from 'react';
import { Camera, Settings, MapPin, MessageCircle, Heart, Sparkles, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Pet } from '@/types/social';

interface PetProfileCardProps {
  pet: Pet;
  postsCount: number;
  isOwner: boolean;
}

export const PetProfileCard = ({ pet, postsCount, isOwner }: PetProfileCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, followersCount, followingCount, follow, unfollow } = useFollow(pet.id);

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

  return (
    <Card className="overflow-hidden border-0 shadow-card rounded-3xl animate-fade-in">
      {/* Cover Photo */}
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-primary/30 via-accent/20 to-lavender/30 overflow-hidden">
        {pet.cover_photo_url ? (
          <img 
            src={pet.cover_photo_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Decorative elements for default cover */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-4 left-4 text-4xl opacity-30 animate-float">🐾</div>
              <div className="absolute top-12 right-8 text-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>✨</div>
              <div className="absolute bottom-8 left-1/3 text-2xl opacity-25 animate-float" style={{ animationDelay: '2s' }}>💖</div>
              <div className="absolute top-1/2 right-1/4 text-3xl opacity-20 animate-float" style={{ animationDelay: '3s' }}>🐾</div>
            </div>
          </>
        )}
        {isOwner && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-card/80 backdrop-blur hover:bg-card shadow-lg"
            onClick={() => navigate(`/pets/${pet.id}/edit`)}
          >
            <Camera className="h-5 w-5" />
          </Button>
        )}
      </div>

      <CardContent className="relative pt-0 px-4 sm:px-6 pb-6">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-20">
          <div className="relative">
            <div className="p-1 rounded-full bg-gradient-to-br from-primary via-accent to-lavender shadow-glow">
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-card">
                <AvatarImage src={pet.avatar_url || ''} alt={pet.name} className="object-cover" />
                <AvatarFallback className="text-4xl sm:text-5xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                  {pet.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            {isOwner && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-card shadow-lg"
                onClick={() => navigate(`/pets/${pet.id}/edit`)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
                {pet.name}
                <Sparkles className="h-5 w-5 text-sunshine" />
              </h1>
              <p className="text-muted-foreground font-medium mt-1">
                {pet.species}
                {pet.breed && <span className="text-primary"> • {pet.breed}</span>}
                {pet.age && <span> • {pet.age}</span>}
              </p>
              {pet.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {pet.location}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {isOwner ? (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                  className="rounded-xl border-2 font-bold hover:bg-primary/5 hover:border-primary hover:text-primary"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    variant={isFollowing ? 'outline' : 'default'}
                    onClick={handleFollowToggle}
                    className={`rounded-xl font-bold min-w-[100px] ${
                      isFollowing 
                        ? 'border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive' 
                        : 'btn-primary'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Heart className="h-4 w-4 mr-1 fill-current" />
                        Following
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={handleMessage}
                    title="Send message"
                    className="rounded-xl border-2 hover:bg-sky/10 hover:border-sky hover:text-sky"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {pet.bio && (
          <p className="mt-5 text-sm leading-relaxed bg-muted/50 p-4 rounded-xl">{pet.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-2 sm:gap-4 mt-6 pt-5 border-t border-border/50">
          {[
            { value: postsCount, label: 'Posts', icon: Sparkles, color: 'from-primary to-coral-dark' },
            { value: followersCount, label: 'Followers', icon: Users, color: 'from-accent to-mint' },
            { value: followingCount, label: 'Following', icon: Heart, color: 'from-lavender to-sky' },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="flex-1 text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-transparent hover:from-muted hover:to-muted/50 transition-all duration-300 cursor-default group"
            >
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};