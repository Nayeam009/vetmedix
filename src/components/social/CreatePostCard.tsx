import { useState, useRef } from 'react';
import { Image, Video, X, Loader2 } from 'lucide-react';
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

    // Generate previews
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
      // Upload media files
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

      // Create post
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
      <Card className="mb-4">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground mb-2">Login to share posts</p>
          <Button onClick={() => navigate('/auth')}>Login</Button>
        </CardContent>
      </Card>
    );
  }

  if (pets.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4 text-center">
          <p className="text-muted-foreground mb-2">Create a pet profile to start posting</p>
          <Button onClick={() => navigate('/pets/new')}>Add Pet</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={activePet?.avatar_url || ''} alt={activePet?.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {activePet?.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={`What's ${activePet?.name || 'your pet'} up to?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0 text-base"
              maxLength={1000}
            />
            
            {/* Media previews */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    {mediaType === 'video' ? (
                      <video src={preview} className="w-full h-32 object-cover" />
                    ) : (
                      <img src={preview} alt="" className="w-full h-32 object-cover" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleFileSelect('image')}
                  disabled={submitting}
                >
                  <Image className="h-5 w-5 mr-1 text-green-600" />
                  Photo
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleFileSelect('video')}
                  disabled={submitting}
                >
                  <Video className="h-5 w-5 mr-1 text-blue-600" />
                  Video
                </Button>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={submitting || (!content.trim() && mediaFiles.length === 0)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
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
