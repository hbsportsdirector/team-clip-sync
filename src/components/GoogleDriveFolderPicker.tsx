
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, FolderIcon, ChevronRight, AlertCircle, RefreshCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getGoogleDriveFolderLink } from '@/services/driveService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Folder {
  id: string;
  name: string;
}

interface GoogleDriveFolderPickerProps {
  onSelect: (folderId: string, folderName: string) => void;
  buttonLabel?: string;
  selectedFolderId?: string;
}

const GoogleDriveFolderPicker = ({ 
  onSelect, 
  buttonLabel = "Select Google Drive Folder", 
  selectedFolderId 
}: GoogleDriveFolderPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<Folder[]>([{ id: 'root', name: 'My Drive' }]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { getGoogleAccessToken, isAuthenticated, hasGoogleConnected, signInWithGoogle, refreshGoogleToken } = useAuth();

  const fetchFolders = async (folderId: string = 'root') => {
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = await getGoogleAccessToken();
      
      if (!accessToken) {
        setError('No Google access token available. Please ensure you are logged in with Google.');
        toast.error('Unable to access Google Drive. Please login with Google.');
        return;
      }

      console.log('Fetching folders with token', accessToken.substring(0, 10) + '...');
      
      const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
      
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Google Drive API error:', errorData);
        
        if (response.status === 403) {
          setError(`Permission denied (403). Your Google account may not have the necessary permissions to access Drive folders. Try reconnecting your Google account.`);
          toast.error('Permission denied for Google Drive. Try reconnecting your Google account.');
        } else if (response.status === 401) {
          setError('Authentication token expired. Please try refreshing your session.');
          
          // Attempt to refresh the token
          const refreshedToken = await refreshGoogleToken();
          if (refreshedToken) {
            toast.success('Token refreshed, trying again...');
            // Wait a moment and try again
            setTimeout(() => fetchFolders(folderId), 1000);
            return;
          }
        } else {
          setError(`API Error: ${response.status} ${response.statusText}`);
        }
        
        throw new Error(`Failed to fetch folders: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Folders fetched:', data);
      
      if (!data.files || !Array.isArray(data.files)) {
        setError('Invalid response format from Google Drive API');
        return;
      }
      
      setFolders(data.files || []);
      
      if (data.files.length === 0) {
        console.log('No folders found in this location');
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, folder]);
    fetchFolders(folder.id);
  };

  const navigateBack = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
    fetchFolders(newPath[newPath.length - 1].id);
  };

  const handleSelect = (folder: Folder) => {
    onSelect(folder.id, folder.name);
    setIsOpen(false);
  };

  const handleOpenDialog = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to access Drive folders");
      return;
    }
    
    if (!hasGoogleConnected) {
      toast.error("Google Drive access not available. Please sign in with Google.");
      return;
    }
    
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      toast.error("Google Drive access not available. Please sign in with Google again.");
      return;
    }
    
    console.log("Opening folder picker dialog");
    setIsOpen(true);
  };

  // Handle Google reconnection
  const handleReconnectGoogle = async () => {
    try {
      await signInWithGoogle();
      toast.success("Reconnecting to Google. Please try again after login.");
      setIsOpen(false);
    } catch (error) {
      console.error("Error reconnecting to Google:", error);
      toast.error("Failed to reconnect to Google");
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened, fetching folders");
      fetchFolders(currentFolderId);
    }
  }, [isOpen]);

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const renderButtonContent = () => {
    if (selectedFolderId) {
      return 'Change Folder';
    } else {
      return (
        <>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018 0-3.878 3.132-7.018 7-7.018 1.89 0 3.47.697 4.682 1.829l-1.974 1.978v-.004c-.735-.702-1.667-1.062-2.708-1.062-2.31 0-4.187 1.956-4.187 4.273 0 2.315 1.877 4.277 4.187 4.277 2.096 0 3.522-1.202 3.816-2.852H12.14v-2.737h6.585c.088.47.135.96.135 1.474 0 4.01-2.677 6.86-6.72 6.86z" fill="currentColor"/>
          </svg>
          {buttonLabel}
        </>
      );
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpenDialog}
        variant="outline"
        type="button"
        className="w-full"
        disabled={!hasGoogleConnected}
      >
        {renderButtonContent()}
      </Button>

      {selectedFolderId && (
        <div className="text-sm text-muted-foreground mt-1">
          <a 
            href={getGoogleDriveFolderLink(selectedFolderId)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline text-blue-500"
          >
            View folder in Google Drive
          </a>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Google Drive Folder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            
            <div className="flex items-center space-x-1 text-sm text-muted-foreground overflow-x-auto pb-2">
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  {index > 0 && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                  <button 
                    onClick={() => navigateBack(index)}
                    className="hover:underline whitespace-nowrap"
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {(error.includes('Permission denied') || error.includes('expired')) && (
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={handleReconnectGoogle}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reconnect Google Account
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="max-h-[50vh] overflow-y-auto border rounded-md">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredFolders.length > 0 ? (
                <div className="divide-y">
                  {filteredFolders.map((folder) => (
                    <div 
                      key={folder.id} 
                      className="flex items-center p-3 hover:bg-muted cursor-pointer"
                    >
                      <FolderIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span 
                        className="flex-grow"
                        onClick={() => navigateToFolder(folder)}
                      >
                        {folder.name}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleSelect(folder)}
                      >
                        Select
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {loading ? 'Loading folders...' : 'No folders found'}
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-sm text-muted-foreground">
                {!hasGoogleConnected && (
                  <span className="text-amber-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" /> Not connected to Google
                  </span>
                )}
              </div>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleDriveFolderPicker;
