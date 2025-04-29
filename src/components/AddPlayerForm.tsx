
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
import { Loader2 } from 'lucide-react';
import GoogleDriveFolderPicker from './GoogleDriveFolderPicker';
import { useAuth } from '@/contexts/AuthContext';

const AddPlayerForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [driveFolder, setDriveFolder] = useState('');
  const [driveFolderName, setDriveFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPlayer } = usePlayers();
  const { getGoogleAccessToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Player name is required');
      return;
    }

    // In a real app, we would validate the folder ID
    const folderValue = driveFolder.trim() || `mock-folder-${Date.now()}`;
    
    setIsSubmitting(true);
    try {
      await addPlayer(name.trim(), folderValue);
      setName('');
      setDriveFolder('');
      setDriveFolderName('');
      setOpen(false);
      
      // Show success toast with a different message if a real folder was selected
      if (driveFolder.trim()) {
        toast.success(`Player ${name} added with Google Drive folder`);
      } else {
        toast.success(`Player ${name} added`);
      }
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFolderSelected = (folderId: string, folderName: string) => {
    setDriveFolder(folderId);
    setDriveFolderName(folderName);
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
            Enter the player's name and select a Google Drive folder
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
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="folder">Google Drive Folder</Label>
              
              <GoogleDriveFolderPicker 
                onSelect={handleFolderSelected}
                selectedFolderId={driveFolder}
              />
              
              {driveFolderName && (
                <div className="text-sm text-muted-foreground mt-1">
                  Selected folder: {driveFolderName}
                </div>
              )}
              
              {!driveFolder && (
                <p className="text-xs text-muted-foreground">
                  If no folder is selected, a mock folder ID will be used
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-team-primary hover:bg-team-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerForm;
