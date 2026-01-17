import { useState, useRef } from 'react';
import { Image, Video, X, Loader2, Smile, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
  
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [submitting, setSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
        
        const { error: uploadError, data } = await supabase.storage
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

      toast.success('Post created! 🎉');
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      setIsFocused(false);
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

  if (!user) {
    return (
      <Card className="mb-6 border-0 shadow-card rounded-2xl overflow-hidden bg-gradient-to-br from-card to-secondary/30">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4 font-medium">Join our pet-loving community!</p>
          <Button 
            onClick={() => navigate('/auth')}
            className="btn-primary rounded-xl px-6"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="mb-6 border-0 shadow-card rounded-2xl overflow-hidden bg-gradient-to-br from-card to-accent/10">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center animate-bounce-gentle">
            <span className="text-3xl">🐾</span>
          </div>
          <p className="text-muted-foreground mb-4 font-medium">Add your furry friend to start sharing!</p>
          <Button 
            onClick={() => navigate('/pets/new')}
            className="btn-accent rounded-xl px-6"
          >
            Add Your Pet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 border-0 shadow-card rounded-2xl overflow-hidden transition-all duration-300 ${
      isFocused ? 'shadow-hover ring-2 ring-primary/20' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="p-0.5 rounded-full bg-gradient-to-br from-primary via-accent to-lavender h-fit">
            <Avatar className="h-11 w-11 border-2 border-card">
              <AvatarImage src={activePet?.avatar_url || ''} alt={activePet?.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                {activePet?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <Textarea
              placeholder={`What's ${activePet?.name || 'your pet'} up to today? 🐾`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => !content && !mediaFiles.length && setIsFocused(false)}
              className="min-h-[60px] resize-none border-0 focus-visible:ring-0 p-0 text-base bg-transparent placeholder:text-muted-foreground/60"
              maxLength={1000}
            />
            
            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden group">
                    {mediaType === 'video' ? (
                      <video src={preview} className="w-full h-32 object-cover" />
                    ) : (
                      <img src={preview} alt="" className="w-full h-32 object-cover" />
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className={`flex items-center justify-between mt-4 pt-4 border-t border-border/50 transition-all ${
              isFocused || content || mediaFiles.length ? 'opacity-100' : 'opacity-70'
            }`}>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleFileSelect('image')}
                  disabled={submitting}
                  className="rounded-xl hover:bg-mint/10 hover:text-mint gap-2"
                >
                  <Image className="h-5 w-5" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleFileSelect('video')}
                  disabled={submitting}
                  className="rounded-xl hover:bg-sky/10 hover:text-sky gap-2"
                >
                  <Video className="h-5 w-5" />
                  <span className="hidden sm:inline">Video</span>
                </Button>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={submitting || (!content.trim() && mediaFiles.length === 0)}
                className="btn-primary rounded-xl px-6 font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Share'
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesChange}
        />
      </CardContent>
    </Card>
  );
};