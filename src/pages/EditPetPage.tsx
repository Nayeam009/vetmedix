import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Pet } from '@/types/social';
import { compressImage, getCompressionMessage } from '@/lib/mediaCompression';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { removeStorageFiles, validateImageFile } from '@/lib/storageUtils';
import { logger } from '@/lib/logger';

const speciesOptions = [
  'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 
  'Guinea Pig', 'Turtle', 'Snake', 'Lizard', 'Horse', 'Other'
];

const EditPetPage = () => {
  useDocumentTitle('Edit Pet Profile');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshPets } = usePets();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('pets')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        const petData = data as Pet;
        
        // Check ownership
        if (petData.user_id !== user?.id) {
          toast.error('You can only edit your own pets');
          navigate('/feed');
          return;
        }

        setPet(petData);
        setName(petData.name);
        setSpecies(petData.species);
        setBreed(petData.breed || '');
        setAge(petData.age || '');
        setBio(petData.bio || '');
        setAvatarPreview(petData.avatar_url || '');
        setCoverPreview(petData.cover_photo_url || '');
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching pet:', error);
        }
        toast.error('Pet not found');
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id, user, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pet) return;

    if (!name.trim() || !species) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl = pet.avatar_url;
      let coverUrl = pet.cover_photo_url;

      // Upload new avatar if provided
      if (avatarFile) {
        // Clean up old avatar
        if (pet.avatar_url) {
          await removeStorageFiles([pet.avatar_url], 'pet-media');
        }

        const compressed = await compressImage(avatarFile, 'avatar');
        if (compressed.compressionRatio > 1) {
          toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
        }

        const fileExt = compressed.file.name.split('.').pop();
        const fileName = `${user.id}/avatars/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, compressed.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Upload new cover if provided
      if (coverFile) {
        // Clean up old cover
        if (pet.cover_photo_url) {
          await removeStorageFiles([pet.cover_photo_url], 'pet-media');
        }

        const compressed = await compressImage(coverFile, 'feed');
        if (compressed.compressionRatio > 1) {
          toast.success(getCompressionMessage(compressed.originalSize, compressed.compressedSize));
        }

        const fileExt = compressed.file.name.split('.').pop();
        const fileName = `${user.id}/covers/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, compressed.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        coverUrl = publicUrl;
      }

      // Update pet profile
      const { error } = await supabase
        .from('pets')
        .update({
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          age: age.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          cover_photo_url: coverUrl,
        })
        .eq('id', pet.id);

      if (error) throw error;

      await refreshPets();
      toast.success('Pet profile updated!');
      navigate(`/pet/${pet.id}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error updating pet:', error);
      }
      toast.error('Failed to update pet profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pet) return;

    setDeleting(true);
    try {
      // Collect all storage URLs to clean up (pet avatar, cover, and all post media)
      const urlsToRemove: string[] = [];
      if (pet.avatar_url) urlsToRemove.push(pet.avatar_url);
      if (pet.cover_photo_url) urlsToRemove.push(pet.cover_photo_url);

      // Fetch post media URLs before cascade deletes them
      const { data: posts } = await supabase
        .from('posts')
        .select('media_urls')
        .eq('pet_id', pet.id);

      if (posts) {
        for (const post of posts) {
          if (post.media_urls) {
            urlsToRemove.push(...post.media_urls);
          }
        }
      }

      // Delete DB row (cascades to posts, likes, comments, follows, stories)
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', pet.id);

      if (error) throw error;

      // Clean up storage files after successful DB deletion
      if (urlsToRemove.length > 0) {
        await removeStorageFiles(urlsToRemove);
      }

      await refreshPets();
      toast.success('Pet profile deleted');
      navigate('/feed');
    } catch (error) {
      logger.error('Error deleting pet:', error);
      toast.error('Failed to delete pet profile');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!pet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-lg">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit Pet Profile</CardTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {pet.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {pet.name}'s profile and all their posts. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Photo */}
              <div 
                className="relative h-32 bg-gradient-to-r from-primary/30 to-accent/30 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview && (
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" decoding="async" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <span className="ml-2 text-white">Change Cover</span>
                </div>
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverChange}
              />

              {/* Avatar */}
              <div className="flex justify-center -mt-16">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {name.charAt(0) || '🐾'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Pet Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your pet's name"
                  maxLength={50}
                  required
                />
              </div>

              {/* Species */}
              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Select value={species} onValueChange={setSpecies} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Breed */}
              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input
                  id="breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g., Golden Retriever, Persian"
                  maxLength={50}
                />
              </div>

              {/* Age */}
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g., 2 years, 6 months"
                  maxLength={30}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your pet..."
                  maxLength={300}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default EditPetPage;
