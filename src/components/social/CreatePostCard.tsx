import { useState, useRef } from 'react';
import { Image, Video, X, Loader2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CreatePostCardProps {
  onPostCreated: () => void;
}

export const CreatePostCard = ({ onPostCreated }: CreatePostCardProps) => {
  const { user } = useAuth();
  const { activePet, pets } = usePets();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileSelect = (type: 'image' | 'video') => {
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }
    if (!activePet) {
      toast.error('Please create a pet profile first');
      navigate('/pets/new');
      return;
    }
    setMediaType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) {
      toast.error('Maximum 4 files allowed');
      return;
    }

    const newFiles = [...mediaFiles, ...files].slice(0, 4);
    setMediaFiles(newFiles);
    setIsExpanded(true);

    const previews = newFiles.map(file => URL.createObjectURL(file));
    setMediaPreviews(previews);
  };

  const removeMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!user || !activePet) return;
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Please add some content or media');
      return;
    }

    setSubmitting(true);
    try {
      const mediaUrls: string[] = [];
      
      for (const file of mediaFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        mediaUrls.push(publicUrl);
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          pet_id: activePet.id,
          user_id: user.id,
          content: content.trim() || null,
          media_urls: mediaUrls,
          media_type: mediaType,
        });

      if (error) throw error;

      toast.success('Post created!');
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setIsExpanded(false);
      onPostCreated();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating post:', error);
      }
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (pets.length === 0) {
      navigate('/pets/new');
      return;
    }
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  if (!user) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-lg">🐾</span>
          </div>
          <button 
            onClick={() => navigate('/auth')}
            className="flex-1 h-10 bg-muted hover:bg-muted/80 rounded-full px-4 text-left text-muted-foreground text-sm transition-colors"
          >
            Join to share with pet lovers...
          </button>
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-lg">🐶</span>
          </div>
          <button 
            onClick={() => navigate('/pets/new')}
            className="flex-1 h-10 bg-muted hover:bg-muted/80 rounded-full px-4 text-left text-muted-foreground text-sm transition-colors"
          >
            Add your pet to start posting...
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border mb-4">
      {/* Composer Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-1 ring-border cursor-pointer" onClick={() => navigate(`/pet/${activePet?.id}`)}>
            <AvatarImage src={activePet?.avatar_url || ''} alt={activePet?.name} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {activePet?.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          
          {!isExpanded ? (
            <button 
              onClick={handleInputClick}
              className="flex-1 h-10 bg-muted hover:bg-muted/80 rounded-full px-4 text-left text-muted-foreground text-sm transition-colors"
            >
              What's {activePet?.name} up to?
            </button>
          ) : (
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{activePet?.name}</p>
              <p className="text-xs text-muted-foreground">Public</p>
            </div>
          )}
        </div>

        {/* Expanded Textarea */}
        {isExpanded && (
          <div className="mt-3">
            <textarea
              ref={textareaRef}
              placeholder={`What's on ${activePet?.name}'s mind?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[100px] resize-none border-0 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 focus:outline-none"
              maxLength={1000}
            />
            
            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
              <div className="border border-border rounded-lg p-2 mt-2">
                <div className={`grid gap-2 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden group">
                      {mediaType === 'video' ? (
                        <video src={preview} className="w-full h-32 object-cover" />
                      ) : (
                        <img src={preview} alt="" className="w-full h-32 object-cover" />
                      )}
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-foreground/80 hover:bg-foreground text-background shadow-lg"
                        onClick={() => removeMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="border-t border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFileSelect('image')}
              disabled={submitting}
              className="h-9 gap-2 rounded-lg text-green-600 hover:bg-green-50 hover:text-green-700 font-semibold text-sm"
            >
              <Image className="h-5 w-5" />
              <span className="hidden sm:inline">Photo</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => handleFileSelect('video')}
              disabled={submitting}
              className="h-9 gap-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold text-sm"
            >
              <Video className="h-5 w-5" />
              <span className="hidden sm:inline">Video</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              disabled={submitting}
              className="h-9 gap-2 rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-600 font-semibold text-sm"
            >
              <Smile className="h-5 w-5" />
              <span className="hidden sm:inline">Feeling</span>
            </Button>
          </div>
          
          {isExpanded && (
            <Button 
              onClick={handleSubmit}
              disabled={submitting || (!content.trim() && mediaFiles.length === 0)}
              className="h-9 px-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Post'
              )}
            </Button>
          )}
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesChange}
      />
    </div>
  );
};