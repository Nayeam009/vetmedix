import { useState, useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { useStories } from '@/hooks/useStories';
import { StoryViewer } from './StoryViewer';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { StoryGroup } from '@/types/social';

export const StoriesBar = () => {
  const { user } = useAuth();
  const { activePet, pets } = usePets();
  const { storyGroups, createStory, markAsViewed, refresh } = useStories();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialGroupIndex, setInitialGroupIndex] = useState(0);

  const handleAddStory = () => {
    if (!user) {
      toast.error('Please login to add stories');
      navigate('/auth');
      return;
    }
    if (!activePet) {
      toast.error('Please create a pet profile first');
      navigate('/pets/new');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePet) return;

    // Validate file
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast.error('Please select an image or video');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    const result = await createStory(activePet.id, file);
    setUploading(false);

    if (result) {
      toast.success('Story added!');
    } else {
      toast.error('Failed to add story');
    }

    // Reset input
    e.target.value = '';
  };

  const openViewer = (index: number) => {
    setInitialGroupIndex(index);
    setViewerOpen(true);
  };

  // Check if current user has stories
  const userHasStory = activePet && storyGroups.some(g => g.pet.id === activePet.id);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto py-4 px-1 scrollbar-hide">
        {/* Add Story Button */}
        {user && pets.length > 0 && (
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={handleAddStory}
              disabled={uploading}
              className="relative"
            >
              <Avatar className={`h-16 w-16 sm:h-18 sm:w-18 border-2 ${userHasStory ? 'border-primary' : 'border-dashed border-muted-foreground/50'}`}>
                <AvatarImage src={activePet?.avatar_url || ''} />
                <AvatarFallback className="bg-muted">
                  {activePet?.name?.charAt(0) || '+'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                {uploading ? (
                  <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                ) : (
                  <Plus className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
            </button>
            <span className="text-xs text-muted-foreground truncate w-16 text-center">
              Your Story
            </span>
          </div>
        )}

        {/* Story Groups */}
        {storyGroups.map((group, index) => (
          <div 
            key={group.pet.id} 
            className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer"
            onClick={() => openViewer(index)}
          >
            <Avatar className={`h-16 w-16 sm:h-18 sm:w-18 ${
              group.hasUnviewed 
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                : 'border-2 border-muted'
            }`}>
              <AvatarImage src={group.pet.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10">
                {group.pet.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-foreground truncate w-16 text-center">
              {group.pet.name}
            </span>
          </div>
        ))}

        {storyGroups.length === 0 && !user && (
          <div className="text-muted-foreground text-sm py-4">
            Login to see stories from pets you follow
          </div>
        )}
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && storyGroups.length > 0 && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={initialGroupIndex}
          onClose={() => {
            setViewerOpen(false);
            refresh();
          }}
          onViewed={markAsViewed}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};
