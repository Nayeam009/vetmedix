import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, Loader2, X, MapPin, Users, Heart, Sparkles, PawPrint } from 'lucide-react';
import Navbar from '@/components/Navbar';
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
  SheetClose,
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import type { Pet } from '@/types/social';

const speciesOptions = ['All', 'Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Hamster', 'Other'];

const speciesEmojis: Record<string, string> = {
  Dog: '🐕',
  Cat: '🐱',
  Bird: '🐦',
  Fish: '🐠',
  Rabbit: '🐰',
  Hamster: '🐹',
  Other: '🐾',
};

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
      className="group cursor-pointer card-playful overflow-hidden animate-fade-in"
      onClick={() => navigate(`/pet/${pet.id}`)}
    >
      {/* Cover/Header Section */}
      <div className="relative h-20 sm:h-24 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary overflow-hidden">
        <div className="absolute inset-0 paw-pattern opacity-50" />
        <div className="absolute -bottom-8 left-4">
          <div className="avatar-gradient p-0.5 rounded-full">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-card">
              <AvatarImage src={pet.avatar_url || ''} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-xl sm:text-2xl font-bold text-primary">
                {pet.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* Species Badge */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-card/90 backdrop-blur-sm text-foreground border-0 shadow-sm text-xs font-medium">
            {speciesEmojis[pet.species] || '🐾'} {pet.species}
          </Badge>
        </div>
      </div>

      <CardContent className="pt-10 sm:pt-12 pb-4 px-4">
        {/* Name & Follow Button Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base sm:text-lg truncate group-hover:text-primary transition-colors">
              {pet.name}
            </h3>
            {pet.breed && (
              <p className="text-sm text-muted-foreground truncate">{pet.breed}</p>
            )}
          </div>
          {!isOwner && (
            <Button
              variant={isFollowing ? 'outline' : 'default'}
              size="sm"
              onClick={handleFollowClick}
              className={`shrink-0 min-h-[36px] text-xs sm:text-sm ${
                isFollowing 
                  ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive' 
                  : 'btn-primary'
              }`}
            >
              {isFollowing ? (
                <>
                  <Heart className="h-3.5 w-3.5 mr-1 fill-current" />
                  Following
                </>
              ) : (
                <>
                  <Heart className="h-3.5 w-3.5 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {followersCount} followers
          </span>
          {pet.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{pet.location}</span>
            </span>
          )}
        </div>

        {/* Bio */}
        {pet.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {pet.bio}
          </p>
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
  const activeFilterCount = [searchQuery, species !== 'All' ? species : null, location].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Navbar />
      
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/20 border-b border-border/50">
        <div className="absolute inset-0 paw-pattern opacity-30" />
        <div className="container mx-auto px-4 py-6 sm:py-10 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-3 sm:mb-4">
              <Sparkles className="h-4 w-4" />
              Discover Amazing Pets
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">
              Explore <span className="text-gradient">Pets</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              Find and connect with adorable pets from your community
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Search & Filters - Sticky on Mobile */}
          <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 sm:static sm:bg-transparent sm:backdrop-blur-none sm:mx-0 sm:px-0 sm:py-0 sm:mb-6 border-b sm:border-none border-border/50">
            <div className="flex flex-col gap-3">
              {/* Search Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pets by name or breed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 h-11 sm:h-10 bg-card border-border/50 focus-visible:ring-primary/30"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="btn-primary h-11 sm:h-10 px-4 sm:px-6"
                >
                  <Search className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>

              {/* Filter Row */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {/* Species Pills - Mobile Horizontal Scroll */}
                <div className="flex gap-1.5 sm:gap-2">
                  {speciesOptions.slice(0, 5).map((s) => (
                    <Button
                      key={s}
                      variant={species === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSpecies(s)}
                      className={`shrink-0 h-9 text-xs sm:text-sm ${
                        species === s 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-card hover:bg-secondary'
                      }`}
                    >
                      {s !== 'All' && <span className="mr-1">{speciesEmojis[s]}</span>}
                      {s}
                    </Button>
                  ))}
                </div>

                {/* More Species Dropdown */}
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger className="w-auto h-9 shrink-0 bg-card border-border/50 text-xs sm:text-sm">
                    <span className="flex items-center gap-1">
                      <PawPrint className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">More</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {speciesOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s !== 'All' && <span className="mr-2">{speciesEmojis[s]}</span>}
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={`shrink-0 h-9 gap-1.5 bg-card border-border/50 ${
                        location ? 'border-primary text-primary' : ''
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{location || 'Location'}</span>
                      {location && <span className="sm:hidden">📍</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-2xl">
                    <SheetHeader className="pb-4">
                      <SheetTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Filter by Location
                      </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Enter city or region..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="h-12"
                      />
                      <div className="flex gap-2">
                        <SheetClose asChild>
                          <Button 
                            variant="outline" 
                            className="flex-1 h-12"
                            onClick={() => setLocation('')}
                          >
                            Clear
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button 
                            onClick={handleSearch} 
                            className="flex-1 h-12 btn-primary"
                          >
                            Apply Filter
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Active Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 py-3 sm:py-4">
              <span className="text-xs text-muted-foreground">Active:</span>
              {searchQuery && (
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 bg-primary/10 text-primary border-0 hover:bg-primary/20 cursor-pointer"
                  onClick={() => { setSearchQuery(''); handleSearch(); }}
                >
                  <Search className="h-3 w-3" />
                  "{searchQuery}"
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              )}
              {species !== 'All' && (
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 bg-accent/10 text-accent border-0 hover:bg-accent/20 cursor-pointer"
                  onClick={() => setSpecies('All')}
                >
                  {speciesEmojis[species]} {species}
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              )}
              {location && (
                <Badge 
                  variant="secondary" 
                  className="gap-1.5 pl-2.5 pr-1.5 py-1 bg-secondary text-secondary-foreground border-0 hover:bg-secondary/80 cursor-pointer"
                  onClick={() => { setLocation(''); handleSearch(); }}
                >
                  <MapPin className="h-3 w-3" />
                  {location}
                  <X className="h-3 w-3 ml-0.5" />
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Count */}
          {!loading && pets.length > 0 && (
            <div className="flex items-center justify-between py-2 sm:py-3">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{pets.length}</span> pets
                {hasActiveFilters && ' matching your filters'}
              </p>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
              </div>
              <p className="text-muted-foreground mt-4 text-sm">Finding adorable pets...</p>
            </div>
          ) : pets.length === 0 ? (
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="py-12 sm:py-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <PawPrint className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No pets found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                  We couldn't find any pets matching your search. Try adjusting your filters or search terms.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-2">
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet, index) => (
                <div 
                  key={pet.id} 
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PetCard pet={pet} onFollow={fetchPets} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
