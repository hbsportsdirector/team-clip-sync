
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
import { X, FolderIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GoogleDriveFolderPicker from './GoogleDriveFolderPicker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const ManagePlayersModal = () => {
  const [open, setOpen] = useState(false);
  const { players, removePlayer, updatePlayerDriveFolder } = usePlayers();

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
            View, update and delete existing players
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
                  onUpdateFolder={(folderId, folderName) => updatePlayerDriveFolder(player.id, folderId, folderName)}
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
  onUpdateFolder: (folderId: string, folderName: string) => void;
}

const PlayerManageItem = ({ player, onRemove, onUpdateFolder }: PlayerManageItemProps) => {
  return (
    <div className="flex flex-col p-2 rounded-md border">
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          <div className="font-medium">{player.name}</div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive hover:text-destructive/90"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full text-left flex justify-between">
              <span className="truncate flex-grow">
                {player.driveFolder ? 'Change Google Drive Folder' : 'Set Google Drive Folder'}
              </span>
              <FolderIcon className="h-4 w-4 ml-2 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-4">
              <GoogleDriveFolderPicker
                onSelect={(folderId, folderName) => onUpdateFolder(folderId, folderName)}
                selectedFolderId={player.driveFolder}
                buttonLabel="Select Folder"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {player.driveFolder && (
        <div className="text-xs text-muted-foreground mt-2 truncate">
          <span className="font-medium">Folder:</span> {player.folderName || player.driveFolder}
        </div>
      )}
      
      <Separator className="my-2" />
    </div>
  );
};

export default ManagePlayersModal;
