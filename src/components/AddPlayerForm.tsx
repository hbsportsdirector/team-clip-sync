// src/components/AddPlayerForm.tsx

import React, { useState } from 'react';
import { usePlayers } from '../contexts/PlayerContext';
import toast from 'react-hot-toast';

export default function AddPlayerForm() {
  const { addPlayer } = usePlayers();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Enter a player email.');
      return;
    }

    setLoading(true);
    try {
      await addPlayer(email.trim());
      toast.success('Player added!');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not add player.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="space-y-2">
      <input
        type="email"
        placeholder="Player email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 rounded border focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-4 py-2 rounded text-white ${
          loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Adding…' : 'Add Player'}
      </button>
    </form>
  );
}
