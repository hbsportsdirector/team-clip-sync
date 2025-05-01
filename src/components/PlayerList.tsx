// src/components/PlayerList.tsx
import React from 'react';
import { usePlayers } from '../contexts/PlayerContext';

export default function PlayerList() {
  const { players, removePlayer } = usePlayers();
  return (
    <ul className="divide-y divide-gray-300">
      {players.map(player => (
        <li key={player.id} className="py-2 flex justify-between items-center">
          <span>{player.name}</span>
          <button
            onClick={() => removePlayer(player.id)}
            className="text-red-500 hover:underline"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
