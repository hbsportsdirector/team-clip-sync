
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface VideoLibraryProps {
  onSelectVideo: (video: { blob: Blob; name: string }) => void;
}

const VideoLibrary = ({ onSelectVideo }: VideoLibraryProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelection = async () => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
          setIsLoading(true);
          try {
            // Pass the video file to the parent component
            onSelectVideo({ blob: file, name: file.name });
          } catch (error) {
            console.error('Error processing video:', error);
            toast.error('Failed to process the video');
          } finally {
            setIsLoading(false);
          }
        }
      };
      
      // Trigger the file selection dialog
      input.click();
    } catch (error) {
      console.error('Error accessing device storage:', error);
      toast.error('Failed to access device storage');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Select a video from your device to play with slow-motion controls and capture snapshots
            </p>
            
            <Button
              onClick={handleFileSelection}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Select Video from Device
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoLibrary;
