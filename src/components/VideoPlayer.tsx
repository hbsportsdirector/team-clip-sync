
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Camera, FastForward, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoPlayerProps {
  videoSrc: string | Blob;
  onSnapshotCapture?: (snapshot: Blob) => void;
}

const VideoPlayer = ({ videoSrc, onSnapshotCapture }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlayingState = () => setIsPlaying(!video.paused);
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlayingState);
    video.addEventListener('pause', handlePlayingState);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlayingState);
      video.removeEventListener('pause', handlePlayingState);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
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

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-2">
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          src={typeof videoSrc === 'string' ? videoSrc : URL.createObjectURL(videoSrc)}
          playsInline 
          onClick={togglePlayPause}
        />
        
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
          <Button 
            size="icon"
            variant="outline"
            onClick={captureSnapshot}
            className="bg-slate-100 hover:bg-slate-200"
            title="Take snapshot"
            disabled={!onSnapshotCapture}
          >
            <Camera className="h-4 w-4" />
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
    </div>
  );
};

export default VideoPlayer;
