
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Player {
  id: string;
  name: string;
  driveFolder: string;
  folderName?: string; // Added this field to store the folder name
  selected: boolean;
}

interface DbPlayer {
  id: string;
  name: string;
  drive_folder: string;
  folder_name?: string; // This field is now in the database schema
  user_id: string;
}

interface PlayerContextType {
  players: Player[];
  loadingPlayers: boolean;
  addPlayer: (name: string, driveFolder: string, folderName?: string) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  togglePlayerSelection: (id: string) => void;
  selectedPlayers: Player[];
  clearSelectedPlayers: () => void;
  updatePlayerDriveFolder: (id: string, folderId: string, folderName?: string) => Promise<void>;
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
          folderName: player.folder_name || null,
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

  const addPlayer = async (name: string, driveFolder: string, folderName?: string) => {
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in to add players');
      return;
    }
    
    try {
      // Create insert data object with folder_name if it's provided
      const insertData: any = { 
        name, 
        drive_folder: driveFolder,
        user_id: user.id 
      };
      
      // Only include folder_name if it's provided
      if (folderName) {
        insertData.folder_name = folderName;
      }
      
      const { data, error } = await supabase
        .from('players')
        .insert([insertData])
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      const newPlayer: Player = {
        id: data.id,
        name: data.name,
        driveFolder: data.drive_folder,
        folderName: data.folder_name || null,
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

  const updatePlayerDriveFolder = async (id: string, folderId: string, folderName?: string) => {
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in to update players');
      return;
    }
    
    try {
      // Update with folder_name now that the column exists
      const updateData: any = { drive_folder: folderId };
      
      // Only include folder_name in the update if it's provided
      if (folderName) {
        updateData.folder_name = folderName;
      }
      
      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.id === id
            ? { ...player, driveFolder: folderId, folderName: folderName || null }
            : player
        )
      );
      
      toast.success('Updated player folder');
    } catch (error: any) {
      console.error('Error updating player folder:', error);
      toast.error(error.message || 'Failed to update player');
    }
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
        updatePlayerDriveFolder,
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
