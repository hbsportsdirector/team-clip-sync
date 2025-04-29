
import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, StopCircle } from 'lucide-react';
import { usePlayers } from '@/contexts/PlayerContext';
import { simulateUploadToMultipleFolders } from '@/services/driveService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Camera = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const { selectedPlayers } = usePlayers();
  const { isAuthenticated } = useAuth();

  // Initialize camera
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true,
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast.error('Could not access camera');
      }
    };

    if (isAuthenticated) {
      initializeCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAuthenticated]);

  const startRecording = () => {
    if (!stream) return;
    
    if (selectedPlayers.length === 0) {
      toast.error('Select at least one player first');
      return;
    }

    setRecordedChunks([]);
    setRecordingTime(0);
    
    const mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };
    
    mediaRecorder.start(1000);
    setIsRecording(true);
    
    // Start timer
    timerRef.current = window.setInterval(() => {
      setRecordingTime(time => time + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const handleRecordingComplete = async () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        
        try {
          setUploading(true);
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `recording_${timestamp}.webm`;
          
          // Upload to Supabase and Google Drive
          await simulateUploadToMultipleFolders(
            videoBlob,
            selectedPlayers.map(player => ({
              id: player.id,
              name: player.name,
              driveFolder: player.driveFolder
            })),
            fileName
          );
          
          // Create a download link for testing
          const url = URL.createObjectURL(videoBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
        } catch (error) {
          console.error('Failed to upload video:', error);
          toast.error('Failed to upload video');
        } finally {
          setUploading(false);
          setRecordedChunks([]);
        }
      };
      
      handleRecordingComplete();
    }
  }, [recordedChunks, isRecording, selectedPlayers]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover" 
          autoPlay 
          playsInline 
          muted
        />
        
        {isRecording && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-lg flex items-center">
            <div className="w-3 h-3 rounded-full bg-white mr-2 animate-pulse" />
            {formatTime(recordingTime)}
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center w-full max-w-md">
        {!isRecording ? (
          <Button 
            onClick={startRecording} 
            className="bg-team-primary hover:bg-team-primary/90 text-white rounded-full w-16 h-16 flex items-center justify-center"
            disabled={uploading || selectedPlayers.length === 0}
          >
            <Play size={32} />
          </Button>
        ) : (
          <Button 
            onClick={stopRecording} 
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center"
          >
            <StopCircle size={32} />
          </Button>
        )}
        
        <div className={cn(
          "mt-4 text-sm text-center",
          selectedPlayers.length === 0 ? "text-red-500" : "text-foreground"
        )}>
          {selectedPlayers.length === 0 
            ? "Select players before recording" 
            : `Recording will be saved to ${selectedPlayers.length} player folder${selectedPlayers.length > 1 ? 's' : ''}`
          }
        </div>
        
        {uploading && (
          <div className="mt-4 text-team-primary">
            Uploading video...
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
