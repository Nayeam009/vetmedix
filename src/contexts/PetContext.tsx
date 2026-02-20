import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import type { Pet } from '@/types/social';

interface PetContextType {
  pets: Pet[];
  activePet: Pet | null;
  setActivePet: (pet: Pet | null) => void;
  loading: boolean;
  refreshPets: () => Promise<void>;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  // Use a ref to always read the latest activePet value without stale closure
  const activePetRef = useRef<Pet | null>(null);
  activePetRef.current = activePet;

  // H-2 Fix: Wrap in useCallback so the function reference is stable and
  // reads activePet via ref to avoid stale closure bugs.
  const refreshPets = useCallback(async () => {
    if (!user) {
      setPets([]);
      setActivePet(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('id, user_id, name, species, breed, age, bio, avatar_url, cover_photo_url, location, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const petsData = (data || []) as Pet[];
      setPets(petsData);
      
      // Use ref to read current activePet — avoids stale closure
      if (petsData.length > 0 && !activePetRef.current) {
        setActivePet(petsData[0]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching pets:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]); // Only depends on user — activePet is read via ref

  useEffect(() => {
    refreshPets();
  }, [refreshPets]);

  const value = useMemo(() => ({
    pets, activePet, setActivePet, loading, refreshPets,
  }), [pets, activePet, loading, refreshPets]);

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (context === undefined) {
    throw new Error('usePets must be used within a PetProvider');
  }
  return context;
};
