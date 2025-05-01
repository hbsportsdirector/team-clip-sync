// src/contexts/PlayerContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

export interface Player {
  id: string;
  name: string;
  driveFolder: string;
}

interface PlayerContextType {
  players: Player[];
  addPlayer: (email: string) => Promise<void>;
  removePlayer: (id: string) => void;
}

const PlayerContext = createContext<PlayerContextType>({
  players: [],
  addPlayer: async () => {},
  removePlayer: () => {},
});

export const PlayerProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const API = import.meta.env.VITE_API_URL;

  // 1) On mount, fetch existing players
  useEffect(() => {
    fetch(`${API}/players`)
      .then((res) => res.json())
      .then((data: Player[]) => setPlayers(data))
      .catch(console.error);
  }, []);

  // 2) Add a new player via POST /players
  const addPlayer = async (email: string) => {
    const res = await fetch(`${API}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error('Failed to add player');
    const newPlayer: Player = await res.json();
    setPlayers((prev) => [...prev, newPlayer]);
  };

  // 3) Local removal (does not delete drive folder)
  const removePlayer = (id: string) =>
    setPlayers((prev) => prev.filter((p) => p.id !== id));

  return (
    <PlayerContext.Provider
      value={{ players, addPlayer, removePlayer }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => useContext(PlayerContext);
