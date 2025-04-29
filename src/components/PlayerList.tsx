
import React from 'react';
import { usePlayers, Player } from '@/contexts/PlayerContext';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Users, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PlayerList = () => {
  const { players, togglePlayerSelection, selectedPlayers, clearSelectedPlayers, loadingPlayers } = usePlayers();

  if (loadingPlayers) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 text-team-primary animate-spin" />
        <p className="mt-2 text-center text-muted-foreground">
          Loading players...
        </p>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Users className="h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-center text-muted-foreground">
          No players added yet. Add your first player to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Select Players</h2>
        {selectedPlayers.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearSelectedPlayers}
          >
            Clear Selection
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {players.map((player) => (
          <PlayerItem 
            key={player.id} 
            player={player} 
            onToggle={() => togglePlayerSelection(player.id)} 
          />
        ))}
      </div>
      
      <Separator className="my-4" />
      
      <div className="mt-2 text-sm text-muted-foreground">
        {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
};

interface PlayerItemProps {
  player: Player;
  onToggle: () => void;
}

const PlayerItem = ({ player, onToggle }: PlayerItemProps) => {
  return (
    <Card className={player.selected ? "border-team-primary" : ""}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Checkbox 
            id={`player-${player.id}`} 
            checked={player.selected} 
            onCheckedChange={onToggle} 
          />
          <label 
            htmlFor={`player-${player.id}`}
            className="text-sm font-medium cursor-pointer flex-grow"
          >
            {player.name}
          </label>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerList;
