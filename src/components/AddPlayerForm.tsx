
import React, { useState } from 'react';
import { usePlayers } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const AddPlayerForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [driveFolder, setDriveFolder] = useState('');
  const { addPlayer } = usePlayers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Player name is required');
      return;
    }

    // In a real app, we would validate the folder ID
    // For now, we'll use any string as a mock folder ID
    const folderValue = driveFolder.trim() || `mock-folder-${Date.now()}`;
    
    addPlayer(name.trim(), folderValue);
    setName('');
    setDriveFolder('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-team-primary hover:bg-team-primary/90">
          Add New Player
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the player's name and Google Drive folder ID
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Player's name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="folder">Google Drive Folder ID (optional)</Label>
              <Input
                id="folder"
                placeholder="Google Drive folder ID"
                value={driveFolder}
                onChange={(e) => setDriveFolder(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can find the folder ID in the URL of your Google Drive folder
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-team-primary hover:bg-team-primary/90">
              Add Player
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerForm;
