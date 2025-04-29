
import React, { useState } from 'react';
import { usePlayers, Player } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const ManagePlayersModal = () => {
  const [open, setOpen] = useState(false);
  const { players, removePlayer } = usePlayers();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Manage Players
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Players</DialogTitle>
          <DialogDescription>
            View and delete existing players
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] overflow-y-auto py-4">
          {players.length > 0 ? (
            <div className="space-y-4">
              {players.map((player) => (
                <PlayerManageItem
                  key={player.id}
                  player={player}
                  onRemove={() => removePlayer(player.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No players added yet
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface PlayerManageItemProps {
  player: Player;
  onRemove: () => void;
}

const PlayerManageItem = ({ player, onRemove }: PlayerManageItemProps) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-md border">
      <div className="flex-grow">
        <div className="font-medium">{player.name}</div>
        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
          Folder ID: {player.driveFolder || 'None'}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 text-destructive hover:text-destructive/90"
      >
        <X className="h-4 w-4" />
      </Button>
      <Separator className="my-2" />
    </div>
  );
};

export default ManagePlayersModal;
