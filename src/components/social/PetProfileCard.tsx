import { useState } from 'react';
import { Camera, Settings, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { useNavigate } from 'react-router-dom';
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

  return (
    <Card className="overflow-hidden">
      {/* Cover Photo */}
      <div className="relative h-32 sm:h-48 bg-gradient-to-r from-primary/30 to-accent/30">
        {pet.cover_photo_url && (
          <img 
            src={pet.cover_photo_url} 
            alt="" 
            className="w-full h-full object-cover"
          />
        )}
        {isOwner && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-80 hover:opacity-100"
            onClick={() => navigate(`/pets/${pet.id}/edit`)}
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      <CardContent className="relative pt-0">
        {/* Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
            <AvatarImage src={pet.avatar_url || ''} alt={pet.name} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {pet.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div>
              <h1 className="text-2xl font-bold">{pet.name}</h1>
              <p className="text-muted-foreground">
                {pet.species}{pet.breed && ` • ${pet.breed}`}
                {pet.age && ` • ${pet.age}`}
              </p>
            </div>

            <div className="flex gap-2">
              {isOwner ? (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  variant={isFollowing ? 'outline' : 'default'}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {pet.bio && (
          <p className="mt-4 text-sm">{pet.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{postsCount}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{followersCount}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{followingCount}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
