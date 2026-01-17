import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, ArrowLeft } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const speciesOptions = [
  'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 
  'Guinea Pig', 'Turtle', 'Snake', 'Lizard', 'Horse', 'Other'
];

const CreatePetPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshPets } = usePets();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login first');
      navigate('/auth');
      return;
    }

    if (!name.trim() || !species) {
      toast.error('Please fill in required fields');
      return;
    }

    // Check pet count limit
    const { count, error: countError } = await supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      toast.error('Failed to verify pet limit');
      return;
    }

    if (count !== null && count >= 30) {
      toast.error('You have reached the maximum limit of 30 pets');
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl = null;

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatars/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pet-media')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('pet-media')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Create pet profile
      const { data, error } = await supabase
        .from('pets')
        .insert({
          user_id: user.id,
          name: name.trim(),
          species,
          breed: breed.trim() || null,
          age: age.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (error) throw error;

      await refreshPets();
      toast.success('Pet profile created!');
      navigate(`/pet/${data.id}`);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating pet:', error);
      }
      toast.error('Failed to create pet profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-lg">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create Pet Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Avatar className="h-24 w-24">
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
                    Creating...
                  </>
                ) : (
                  'Create Pet Profile'
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

export default CreatePetPage;
