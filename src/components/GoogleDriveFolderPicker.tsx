
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, FolderIcon, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const { getGoogleAccessToken } = useAuth();

  const fetchFolders = async (folderId: string = 'root') => {
    setLoading(true);
    try {
      const accessToken = await getGoogleAccessToken();
      
      if (!accessToken) {
        toast.error('Unable to access Google Drive. Please login with Google.');
        setIsOpen(false);
        return;
      }

      const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and '${folderId}' in parents and trashed=false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      
      const data = await response.json();
      setFolders(data.files || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load Google Drive folders');
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

  useEffect(() => {
    if (isOpen) {
      fetchFolders(currentFolderId);
    }
  }, [isOpen]);

  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline"
        type="button"
        className="w-full"
      >
        {selectedFolderId ? 'Change Folder' : buttonLabel}
      </Button>

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
                  No folders found
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GoogleDriveFolderPicker;
