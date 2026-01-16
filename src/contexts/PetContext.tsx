import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const refreshPets = async () => {
    if (!user) {
      setPets([]);
      setActivePet(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const petsData = (data || []) as Pet[];
      setPets(petsData);
      
      // Set first pet as active if no active pet
      if (petsData.length > 0 && !activePet) {
        setActivePet(petsData[0]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching pets:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPets();
  }, [user]);

  return (
    <PetContext.Provider value={{ pets, activePet, setActivePet, loading, refreshPets }}>
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
