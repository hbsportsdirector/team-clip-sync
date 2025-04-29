
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Player {
  id: string;
  name: string;
  driveFolder: string;
  selected: boolean;
}

interface DbPlayer {
  id: string;
  name: string;
  drive_folder: string;
  user_id: string;
}

interface PlayerContextType {
  players: Player[];
  loadingPlayers: boolean;
  addPlayer: (name: string, driveFolder: string) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  togglePlayerSelection: (id: string) => void;
  selectedPlayers: Player[];
  clearSelectedPlayers: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Fetch players from Supabase
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!isAuthenticated || !user) {
        setPlayers([]);
        setLoadingPlayers(false);
        return;
      }

      try {
        setLoadingPlayers(true);
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        const mappedPlayers: Player[] = (data as DbPlayer[]).map(player => ({
          id: player.id,
          name: player.name,
          driveFolder: player.drive_folder,
          selected: false
        }));
        
        setPlayers(mappedPlayers);
      } catch (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players');
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, [isAuthenticated, user]);

  const addPlayer = async (name: string, driveFolder: string) => {
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in to add players');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('players')
        .insert([
          { 
            name, 
            drive_folder: driveFolder,
            user_id: user.id 
          }
        ])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      const newPlayer: Player = {
        id: data.id,
        name: data.name,
        driveFolder: data.drive_folder,
        selected: false,
      };
      
      setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
      toast.success(`Added player: ${name}`);
    } catch (error: any) {
      console.error('Error adding player:', error);
      toast.error(error.message || 'Failed to add player');
    }
  };

  const removePlayer = async (id: string) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to remove players');
      return;
    }
    
    try {
      const playerToRemove = players.find(player => player.id === id);
      
      if (!playerToRemove) {
        throw new Error('Player not found');
      }
      
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== id));
      toast.info(`Removed player: ${playerToRemove.name}`);
    } catch (error: any) {
      console.error('Error removing player:', error);
      toast.error(error.message || 'Failed to remove player');
    }
  };

  const togglePlayerSelection = (id: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === id
          ? { ...player, selected: !player.selected }
          : player
      )
    );
  };

  const selectedPlayers = players.filter((player) => player.selected);

  const clearSelectedPlayers = () => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => ({ ...player, selected: false }))
    );
  };

  return (
    <PlayerContext.Provider
      value={{
        players,
        loadingPlayers,
        addPlayer,
        removePlayer,
        togglePlayerSelection,
        selectedPlayers,
        clearSelectedPlayers,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayers must be used within a PlayerProvider');
  }
  return context;
};
