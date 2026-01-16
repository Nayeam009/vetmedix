import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { PetProfileCard } from '@/components/social/PetProfileCard';
import { PostCard } from '@/components/social/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import type { Pet } from '@/types/social';

const PetProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    posts, 
    loading: postsLoading, 
    likePost, 
    unlikePost, 
    refreshPosts 
  } = usePosts(id, 'pet');

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
        setPet(data as Pet);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching pet:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

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
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Pet Not Found</h1>
          <p className="text-muted-foreground">This pet profile doesn't exist.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === pet.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <PetProfileCard 
          pet={pet} 
          postsCount={posts.length} 
          isOwner={isOwner} 
        />

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Posts</h2>
          
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onUnlike={unlikePost}
                  onDelete={refreshPosts}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PetProfilePage;
