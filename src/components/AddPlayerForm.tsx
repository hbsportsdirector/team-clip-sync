
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
import { Loader2, AlertTriangle } from 'lucide-react';
import GoogleDriveFolderPicker from './GoogleDriveFolderPicker';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AddPlayerForm = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [driveFolder, setDriveFolder] = useState('');
  const [driveFolderName, setDriveFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addPlayer } = usePlayers();
  const { hasGoogleConnected, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Player name is required');
      return;
    }

    // In a real app, we would validate the folder ID
    const folderValue = driveFolder.trim() || '';
    
    setIsSubmitting(true);
    try {
      await addPlayer(name.trim(), folderValue, driveFolderName);
      setName('');
      setDriveFolder('');
      setDriveFolderName('');
      setOpen(false);
      
      // Show success toast with a different message if a real folder was selected
      toast.success(`Player ${name} added${folderValue ? ' with Google Drive folder' : ''}`);
    } catch (error) {
      console.error('Error adding player:', error);
      toast.error('Failed to add player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFolderSelected = (folderId: string, folderName: string) => {
    setDriveFolder(folderId);
    setDriveFolderName(folderName);
  };
  
  const handleConnectGoogle = async () => {
    try {
      // Close the dialog to prevent state issues after redirect
      setOpen(false);
      await signInWithGoogle();
      toast.info('Connecting to Google Drive...');
      // The redirect happens automatically after this
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast.error('Failed to connect with Google');
    }
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
              
              {!hasGoogleConnected && (
                <Alert className="bg-amber-50 border-amber-200 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs text-amber-700">
                    You're not connected with Google. Videos will be saved locally but not uploaded to Google Drive.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleConnectGoogle}
                      className="w-full mt-2 text-xs"
                    >
                      Connect with Google Drive
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
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
                  If no folder is selected, videos will be saved to your account only
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
