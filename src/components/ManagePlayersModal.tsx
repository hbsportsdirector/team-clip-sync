
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
  DialogClose,
} from '@/components/ui/dialog';
import { X, FolderIcon, AlertCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GoogleDriveFolderPicker from './GoogleDriveFolderPicker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ManagePlayersModal = () => {
  const [open, setOpen] = useState(false);
  const { players, removePlayer, updatePlayerDriveFolder } = usePlayers();
  const { hasGoogleConnected, signInWithGoogle } = useAuth();

  const handleConnectGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error connecting to Google:", error);
    }
  };

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
        
        {!hasGoogleConnected && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <p>Google Drive not connected. You need to connect your Google account to access Drive folders.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={handleConnectGoogle}
                >
                  Connect Google Drive
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="max-h-[50vh] overflow-y-auto py-4">
          {players.length > 0 ? (
            <div className="space-y-4">
              {players.map((player) => (
                <PlayerManageItem
                  key={player.id}
                  player={player}
                  onRemove={() => removePlayer(player.id)}
                  onUpdateFolder={(folderId, folderName) => updatePlayerDriveFolder(player.id, folderId, folderName)}
                  hasGoogleConnected={hasGoogleConnected}
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
          <DialogClose asChild>
            <Button variant="outline">
              Close
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface PlayerManageItemProps {
  player: Player;
  onRemove: () => void;
  onUpdateFolder: (folderId: string, folderName: string) => void;
  hasGoogleConnected: boolean;
}

const PlayerManageItem = ({ player, onRemove, onUpdateFolder, hasGoogleConnected }: PlayerManageItemProps) => {
  const [folderPopoverOpen, setFolderPopoverOpen] = useState(false);
  
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
        {hasGoogleConnected ? (
          <Popover open={folderPopoverOpen} onOpenChange={setFolderPopoverOpen}>
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
                  onSelect={(folderId, folderName) => {
                    onUpdateFolder(folderId, folderName);
                    setFolderPopoverOpen(false);
                  }}
                  selectedFolderId={player.driveFolder}
                  buttonLabel="Select Folder"
                />
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-left flex justify-between opacity-70" 
            disabled
          >
            <span className="truncate flex-grow">Connect Google to set folder</span>
            <FolderIcon className="h-4 w-4 ml-2 flex-shrink-0" />
          </Button>
        )}
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
