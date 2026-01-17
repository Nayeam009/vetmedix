import { useState, useRef } from 'react';
import { Image, Video, X, Loader2, Send, Camera, Film } from 'lucide-react';
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
      <Card className="mb-6 border border-border/40 shadow-card rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-primary/20 via-accent/15 to-lavender/20 flex items-center justify-center shadow-soft">
            <span className="text-4xl">🐾</span>
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">Join our pet community!</h3>
          <p className="text-muted-foreground mb-5 text-sm max-w-xs mx-auto">Share adorable moments and connect with fellow pet lovers</p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-primary to-coral-light hover:from-coral-dark hover:to-primary text-white rounded-xl px-8 shadow-button hover:shadow-hover transition-all"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="mb-6 border border-border/40 shadow-card rounded-2xl overflow-hidden bg-gradient-to-br from-card via-card to-mint/5">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-mint/20 via-accent/15 to-sky/20 flex items-center justify-center shadow-soft animate-bounce-gentle">
            <span className="text-4xl">🐶</span>
          </div>
          <h3 className="font-display font-bold text-lg text-foreground mb-2">Add your furry friend!</h3>
          <p className="text-muted-foreground mb-5 text-sm max-w-xs mx-auto">Create a profile for your pet to start sharing</p>
          <Button 
            onClick={() => navigate('/pets/new')}
            className="bg-gradient-to-r from-mint to-accent hover:from-accent hover:to-mint text-white rounded-xl px-8 shadow-button hover:shadow-hover transition-all"
          >
            Add Your Pet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 border shadow-card rounded-2xl overflow-hidden transition-all duration-300 bg-card/95 backdrop-blur-sm ${
      isFocused ? 'shadow-hover border-primary/30 ring-2 ring-primary/10' : 'border-border/40'
    }`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="p-[2px] rounded-full bg-gradient-to-br from-primary via-coral-light to-accent h-fit shadow-sm">
            <Avatar className="h-12 w-12 border-[2.5px] border-card">
              <AvatarImage src={activePet?.avatar_url || ''} alt={activePet?.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold text-lg">
                {activePet?.name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <div className="bg-muted/40 rounded-2xl px-4 py-3 hover:bg-muted/60 transition-colors">
              <Textarea
                placeholder={`What's ${activePet?.name || 'your pet'} up to today?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => !content && !mediaFiles.length && setIsFocused(false)}
                className="min-h-[50px] resize-none border-0 focus-visible:ring-0 p-0 text-[15px] bg-transparent placeholder:text-muted-foreground/50"
                maxLength={1000}
              />
            </div>
            
            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className={`grid gap-2 mt-4 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden group shadow-soft">
                    {mediaType === 'video' ? (
                      <video src={preview} className="w-full h-36 object-cover" />
                    ) : (
                      <img src={preview} alt="" className="w-full h-36 object-cover" />
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className={`flex items-center justify-between mt-4 pt-4 border-t transition-all ${
              isFocused || content || mediaFiles.length ? 'border-border/50 opacity-100' : 'border-transparent opacity-70'
            }`}>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleFileSelect('image')}
                  disabled={submitting}
                  className="rounded-xl hover:bg-mint/10 hover:text-mint gap-2 h-10 px-4"
                >
                  <Camera className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Photo</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleFileSelect('video')}
                  disabled={submitting}
                  className="rounded-xl hover:bg-sky/10 hover:text-sky gap-2 h-10 px-4"
                >
                  <Film className="h-5 w-5" />
                  <span className="hidden sm:inline font-medium">Video</span>
                </Button>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={submitting || (!content.trim() && mediaFiles.length === 0)}
                className="bg-gradient-to-r from-primary to-coral-light hover:from-coral-dark hover:to-primary text-white rounded-xl px-6 h-10 font-semibold shadow-button hover:shadow-hover transition-all gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Posting</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Post</span>
                  </>
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