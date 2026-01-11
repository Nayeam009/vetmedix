import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Loader2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import type { Pet } from '@/types/social';

const speciesOptions = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'];

const PetCard = ({ pet, onFollow }: { pet: Pet; onFollow?: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, followersCount, follow, unfollow } = useFollow(pet.id);
  const isOwner = user?.id === pet.user_id;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
    onFollow?.();
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/pet/${pet.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={pet.avatar_url || ''} />
            <AvatarFallback className="bg-primary/10 text-lg">
              {pet.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{pet.name}</h3>
              <Badge variant="secondary" className="text-xs">{pet.species}</Badge>
            </div>
            {pet.breed && (
              <p className="text-sm text-muted-foreground truncate">{pet.breed}</p>
            )}
            {pet.location && (
              <p className="text-xs text-muted-foreground truncate">📍 {pet.location}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {followersCount} followers
            </p>
          </div>
          {!isOwner && (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleFollowClick}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
        {pet.bio && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{pet.bio}</p>
        )}
      </CardContent>
    </Card>
  );
};

const ExplorePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [species, setSpecies] = useState(searchParams.get('species') || 'All');
  const [location, setLocation] = useState(searchParams.get('location') || '');

  const fetchPets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,breed.ilike.%${searchQuery}%`);
      }

      if (species && species !== 'All') {
        query = query.eq('species', species);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPets((data || []) as Pet[]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching pets:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [species]);

  const handleSearch = () => {
    setSearchParams({
      ...(searchQuery && { q: searchQuery }),
      ...(species !== 'All' && { species }),
      ...(location && { location }),
    });
    fetchPets();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSpecies('All');
    setLocation('');
    setSearchParams({});
    fetchPets();
  };

  const hasActiveFilters = searchQuery || species !== 'All' || location;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Explore Pets</h1>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or breed..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  {speciesOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <Input
                        placeholder="City or region..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSearch} className="w-full">
                      Apply Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{searchQuery}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setSearchQuery(''); handleSearch(); }} />
                </Badge>
              )}
              {species !== 'All' && (
                <Badge variant="secondary" className="gap-1">
                  {species}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setSpecies('All'); }} />
                </Badge>
              )}
              {location && (
                <Badge variant="secondary" className="gap-1">
                  📍 {location}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setLocation(''); handleSearch(); }} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-2">No pets found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} onFollow={fetchPets} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ExplorePage;
