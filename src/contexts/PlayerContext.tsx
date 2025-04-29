
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Player {
  id: string;
  name: string;
  driveFolder: string;
  selected: boolean;
}

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string, driveFolder: string) => void;
  removePlayer: (id: string) => void;
  togglePlayerSelection: (id: string) => void;
  selectedPlayers: Player[];
  clearSelectedPlayers: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    const savedPlayers = localStorage.getItem('players');
    return savedPlayers ? JSON.parse(savedPlayers) : [];
  });

  // Save players to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('players', JSON.stringify(players));
  }, [players]);

  const addPlayer = (name: string, driveFolder: string) => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      name,
      driveFolder,
      selected: false,
    };
    
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer]);
    toast.success(`Added player: ${name}`);
  };

  const removePlayer = (id: string) => {
    const playerToRemove = players.find(player => player.id === id);
    if (playerToRemove) {
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== id));
      toast.info(`Removed player: ${playerToRemove.name}`);
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
