import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Camera, FastForward, Rewind, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createFiveSecondClip, getClipMetadata } from '@/utils/videoUtils';
import { usePlayers } from '@/contexts/PlayerContext';
import { simulateUploadToMultipleFolders } from '@/services/driveService';

interface VideoPlayerProps {
  videoSrc: string | Blob;
  onSnapshotCapture?: (snapshot: Blob) => void;
}

const VideoPlayer = ({ videoSrc, onSnapshotCapture }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clipVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCreatingClip, setIsCreatingClip] = useState(false);
  const [capturedClips, setCapturedClips] = useState<Blob[]>([]);
  const [currentClipIndex, setCurrentClipIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [currentClipUrl, setCurrentClipUrl] = useState<string>('');
  
  const { selectedPlayers } = usePlayers();
  
  // Create URL for the video source if it's a Blob
  useEffect(() => {
    if (videoSrc instanceof Blob) {
      // Create a URL for the Blob
      const url = URL.createObjectURL(videoSrc);
      setVideoUrl(url);
      
      // Clean up the URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (typeof videoSrc === 'string') {
      setVideoUrl(videoSrc);
    }
  }, [videoSrc]);
  
  // Clean up clip URL when component unmounts or when the current clip changes
  useEffect(() => {
    return () => {
      if (currentClipUrl) {
        URL.revokeObjectURL(currentClipUrl);
      }
    };
  }, [currentClipUrl]);
  
  // Handle clip selection and URL creation
  useEffect(() => {
    if (currentClipIndex !== null && capturedClips[currentClipIndex]) {
      // Revoke previous URL if it exists
      if (currentClipUrl) {
        URL.revokeObjectURL(currentClipUrl);
      }
      
      // Create URL for the current clip
      const url = URL.createObjectURL(capturedClips[currentClipIndex]);
      setCurrentClipUrl(url);
    }
  }, [currentClipIndex, capturedClips]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Log video element properties for debugging
    console.log('Video element:', {
      src: video.src,
      currentSrc: video.currentSrc,
      readyState: video.readyState,
      error: video.error
    });
    
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      console.log('Duration loaded:', video.duration);
      setDuration(video.duration);
    };
    const handlePlayingState = () => setIsPlaying(!video.paused);
    
    // Log when metadata is loaded
    const handleMetadata = () => {
      console.log('Metadata loaded:', {
        duration: video.duration,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      setDuration(video.duration);
    };
    
    // Log errors
    const handleError = () => {
      console.error('Video error:', video.error);
      toast.error(`Error playing video: ${video.error?.message || 'Unknown error'}`);
    };
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', handleMetadata);
    video.addEventListener('durationchange', updateDuration);
    video.addEventListener('play', handlePlayingState);
    video.addEventListener('pause', handlePlayingState);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', handleMetadata);
      video.removeEventListener('durationchange', updateDuration);
      video.removeEventListener('play', handlePlayingState);
      video.removeEventListener('pause', handlePlayingState);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        
        // Handle play promise to catch any autoplay restrictions
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video playback started successfully');
            })
            .catch(error => {
              console.error('Error playing video:', error);
              toast.error('Could not play video. Try clicking play again.');
            });
        }
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
      toast.error('Error controlling playback');
    }
  };

  const changeSpeed = (newSpeed: number) => {
    setPlaybackRate(newSpeed);
    toast.info(`Playback speed: ${newSpeed}x`);
  };

  const captureSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !onSnapshotCapture) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onSnapshotCapture(blob);
        toast.success('Snapshot captured!');
      } else {
        toast.error('Failed to capture snapshot');
      }
    }, 'image/jpeg', 0.95);
  };

  const extractClip = async () => {
    if (!videoRef.current) {
      toast.error('Video player not ready');
      return;
    }
    
    if (!(videoSrc instanceof Blob)) {
      toast.error('Cannot extract clip from this video source');
      return;
    }
    
    // Check for player selection, but don't block clip creation
    if (selectedPlayers.length === 0) {
      toast.warning('No players selected. You can still create clips, but select players before uploading.');
    }
    
    try {
      setIsCreatingClip(true);
      toast.info("Creating clip...");
      
      // Get current time position
      const centerTime = videoRef.current.currentTime;
      console.log('Creating clip at time position:', centerTime);
      
      // Create a 5-second clip using our utility
      const clipBlob = await createFiveSecondClip(videoSrc, centerTime);
      console.log('Clip created:', clipBlob);
      
      // Add the clip to our collection
      setCapturedClips(prevClips => {
        const newClips = [...prevClips, clipBlob];
        console.log(`Added clip. Total clips: ${newClips.length}`);
        return newClips;
      });
      
      // Set the current clip index to the newly added clip
      setCurrentClipIndex(prevClips => {
        const newIndex = capturedClips.length; // Point to the index where the new clip will be
        console.log(`Setting current clip index to: ${newIndex}`);
        return newIndex;
      });
      
      toast.success('5-second clip created!');
    } catch (error) {
      console.error('Error creating clip:', error);
      toast.error('Failed to create clip: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreatingClip(false);
    }
  };

  const handleUploadClip = async () => {
    if (currentClipIndex === null || !capturedClips[currentClipIndex]) {
      toast.error('No clip selected to upload');
      return;
    }
    
    if (selectedPlayers.length === 0) {
      toast.error('Please select at least one player');
      return;
    }
    
    try {
      setIsCreatingClip(true);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `clip_${timestamp}.webm`;
      
      // Upload to selected players' folders
      await simulateUploadToMultipleFolders(
        capturedClips[currentClipIndex],
        selectedPlayers.map(player => ({
          id: player.id,
          name: player.name,
          driveFolder: player.driveFolder
        })),
        fileName,
        'clip' // Added this fourth argument: fileType
      );
      
      toast.success('Clip uploaded successfully!');
      
      // Store the uploaded clip index to remove
      const indexToRemove = currentClipIndex;
      
      // Adjust the current index before removing the clip
      if (capturedClips.length > 1) {
        // If we're not at the first clip, go to previous clip
        if (indexToRemove > 0) {
          setCurrentClipIndex(indexToRemove - 1);
        } else {
          // If we're at the first clip, go to the next one
          setCurrentClipIndex(0); // This will be adjusted after removal
        }
      } else {
        // If this was the only clip, set to null
        setCurrentClipIndex(null);
      }
      
      // Clean up the clip URL
      if (currentClipUrl) {
        URL.revokeObjectURL(currentClipUrl);
        setCurrentClipUrl('');
      }
      
      // Remove the uploaded clip from our collection
      setCapturedClips(prev => prev.filter((_, i) => i !== indexToRemove));
      
    } catch (error) {
      console.error('Error uploading clip:', error);
      toast.error('Failed to upload clip');
    } finally {
      setIsCreatingClip(false);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const navigateClip = (direction: 'prev' | 'next') => {
    if (capturedClips.length === 0) return;
    
    if (currentClipIndex === null) {
      setCurrentClipIndex(0);
    } else {
      if (direction === 'prev') {
        setCurrentClipIndex(prev => (prev === null || prev <= 0) ? capturedClips.length - 1 : prev - 1);
      } else {
        setCurrentClipIndex(prev => (prev === null || prev >= capturedClips.length - 1) ? 0 : prev + 1);
      }
    }
  };

  const discardCurrentClip = () => {
    if (currentClipIndex === null || capturedClips.length === 0) return;
    
    // Clean up URL for the clip being discarded
    if (currentClipUrl) {
      URL.revokeObjectURL(currentClipUrl);
      setCurrentClipUrl('');
    }
    
    // Remove the current clip
    setCapturedClips(prev => prev.filter((_, i) => i !== currentClipIndex));
    
    // Update the current index
    if (capturedClips.length <= 1) {
      setCurrentClipIndex(null);
    } else if (currentClipIndex >= capturedClips.length - 1) {
      setCurrentClipIndex(capturedClips.length - 2);
    }
    
    toast.info('Clip discarded');
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-2">
        {videoUrl && (
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain" 
            src={videoUrl}
            playsInline 
            onClick={togglePlayPause}
            onCanPlay={() => console.log('Video can play now')}
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {formatTime(currentTime)}
        </span>
        
        <div className="flex-1 mx-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.01}
            onValueChange={([value]) => seekTo(value)}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-xs text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => changeSpeed(playbackRate === 0.25 ? 0.1 : 0.25)}
            className={cn(
              "bg-slate-100 hover:bg-slate-200",
              (playbackRate === 0.25 || playbackRate === 0.1) && "bg-team-primary/10 text-team-primary hover:bg-team-primary/20"
            )}
            title="Slow motion"
          >
            <Rewind className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => changeSpeed(1)}
            className={cn(
              "bg-slate-100 hover:bg-slate-200",
              playbackRate === 1 && "bg-team-primary/10 text-team-primary hover:bg-team-primary/20"
            )}
            title="Normal speed"
          >
            {playbackRate}x
          </Button>
          
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => changeSpeed(2)}
            className={cn(
              "bg-slate-100 hover:bg-slate-200",
              playbackRate === 2 && "bg-team-primary/10 text-team-primary hover:bg-team-primary/20"
            )}
            title="Fast forward"
          >
            <FastForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {onSnapshotCapture && (
            <Button 
              size="icon"
              variant="outline"
              onClick={captureSnapshot}
              className="bg-slate-100 hover:bg-slate-200"
              title="Take snapshot"
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            size="icon"
            variant="outline"
            onClick={extractClip}
            disabled={isCreatingClip}
            className="bg-slate-100 hover:bg-slate-200"
            title={selectedPlayers.length === 0 ? "Create a 5-second clip (select players before uploading)" : "Create a 5-second clip"}
          >
            <Scissors className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon"
            onClick={togglePlayPause}
            className="bg-team-primary hover:bg-team-primary/90 text-white rounded-full w-10 h-10 flex items-center justify-center"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
        </div>
      </div>
      
      {capturedClips.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {currentClipIndex !== null 
                ? `Clip ${currentClipIndex + 1} of ${capturedClips.length}` 
                : `${capturedClips.length} clip${capturedClips.length !== 1 ? 's' : ''} created`
              }
            </span>
            
            <div className="flex space-x-2">
              {currentClipIndex !== null && (
                <Button 
                  size="sm"
                  variant="outline" 
                  onClick={discardCurrentClip}
                >
                  Discard
                </Button>
              )}
              
              {capturedClips.length > 1 && (
                <div className="flex space-x-1">
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => navigateClip('prev')}
                  >
                    Previous
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    onClick={() => navigateClip('next')}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {currentClipIndex !== null && currentClipUrl && (
            <video 
              ref={clipVideoRef}
              className="w-full h-auto rounded-lg border border-border" 
              src={currentClipUrl} 
              controls
            />
          )}
          
          <Button
            onClick={handleUploadClip}
            disabled={isCreatingClip || selectedPlayers.length === 0 || currentClipIndex === null}
            className="w-full"
          >
            {isCreatingClip 
              ? 'Uploading...' 
              : selectedPlayers.length === 0
                ? 'Select players to upload clip'
                : `Upload clip to ${selectedPlayers.length} player${selectedPlayers.length !== 1 ? 's' : ''}`
            }
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
