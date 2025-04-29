
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import VideoPlayer from '@/components/VideoPlayer';
import VideoLibrary from '@/components/VideoLibrary';
import VideoClipCapture from '@/components/VideoClipCapture';
import { useAuth } from '@/contexts/AuthContext';

const VideoPlayback = () => {
  const [selectedVideo, setSelectedVideo] = useState<{blob: Blob, name: string} | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSnapshotCapture = (snapshot: Blob) => {
    // Create a download link for the snapshot
    const url = URL.createObjectURL(snapshot);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `snapshot_${timestamp}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Snapshot saved to your device');
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b bg-card">
        <div className="container max-w-md px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-team-primary">Video Playback</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>
      </header>

      <main className="container max-w-md px-4 py-6">
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="library">Video Library</TabsTrigger>
            <TabsTrigger value="clip">Clip Capture</TabsTrigger>
          </TabsList>
          
          <TabsContent value="library" className="space-y-4">
            {selectedVideo ? (
              <>
                <div className="mb-4">
                  <VideoPlayer 
                    videoSrc={selectedVideo.blob} 
                    onSnapshotCapture={handleSnapshotCapture}
                  />
                  <div className="text-center text-sm mt-2">
                    {selectedVideo.name}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedVideo(null)} 
                  className="w-full mt-2"
                >
                  Back to Library
                </Button>
              </>
            ) : (
              <VideoLibrary onSelectVideo={setSelectedVideo} />
            )}
          </TabsContent>
          
          <TabsContent value="clip" className="space-y-4">
            <VideoClipCapture />
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <Alert className="bg-slate-50 mt-4">
          <InfoIcon className="h-4 w-4 text-slate-500" />
          <AlertDescription className="text-xs">
            Use slow-motion controls to analyze technique in detail. 
            Capture snapshots at key moments to share with your team.
          </AlertDescription>
        </Alert>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-card py-3 px-4">
        <div className="container max-w-md text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} TeamClipSync
        </div>
      </footer>
    </div>
  );
};

export default VideoPlayback;
