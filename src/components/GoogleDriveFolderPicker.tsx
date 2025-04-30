
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
  const { 
    getGoogleAccessToken, 
    isAuthenticated, 
    hasGoogleConnected, 
    reconnectGoogleWithDriveAccess,
    refreshGoogleToken 
  } = useAuth();

  const fetchFolders = async (folderId: string = 'root') => {
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = await getGoogleAccessToken();
      
      if (!accessToken) {
        setError('No Google access token available. Please connect your Google account with Drive permissions.');
        console.log('No access token available for Drive API');
        return;
      }

      console.log('Fetching folders with access token');
      
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
          setError(`Permission denied. Your Google account may not have the necessary permissions for Drive folders.`);
        } else if (response.status === 401) {
          setError('Authentication token expired. Please try reconnecting your Google account.');
          
          // Attempt to refresh the token
          const refreshedToken = await refreshGoogleToken();
          if (refreshedToken) {
            toast.success('Token refreshed, trying again...');
            // Wait a moment and try again
            setTimeout(() => fetchFolders(folderId), 1000);
            return;
          } else {
            setError('Token refresh failed. Please reconnect with Google to grant Drive permissions.');
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
    if (!hasGoogleConnected) {
      toast.error("Google Drive access not available. Please connect with Google Drive first.");
      return;
    }
    
    setIsOpen(true);
  };

  // Handle Google reconnection using the new reconnect function
  const handleReconnectGoogle = async () => {
    try {
      setIsOpen(false); // Close the dialog first
      toast.info("Reconnecting to Google Drive...");
      await reconnectGoogleWithDriveAccess();
      // The redirect will happen here
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
          <FolderIcon className="w-4 h-4 mr-2" />
          {buttonLabel}
        </>
      );
    }
  };

  return (
    <>
      <Button 
        onClick={hasGoogleConnected ? handleOpenDialog : handleReconnectGoogle}
        variant="outline"
        type="button"
        className="w-full"
      >
        {hasGoogleConnected ? renderButtonContent() : "Connect Google Drive First"}
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
                  {(error.includes('Permission denied') || error.includes('expired') || error.includes('refresh failed') || error.includes('token')) && (
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 w-full"
                        onClick={handleReconnectGoogle}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Reconnect Google Account with Drive Access
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
