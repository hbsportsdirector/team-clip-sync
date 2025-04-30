import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Camera, Timer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import PlayerList from '@/components/PlayerList';
import { usePlayers } from '@/contexts/PlayerContext';
import { simulateUploadToMultipleFolders } from '@/services/driveService';

interface VideoBuffer {
  chunks: Blob[];
  startTime: number;
}

const VideoClipCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedClip, setCapturedClip] = useState<Blob | null>(null);
  const [bufferSeconds, setBufferSeconds] = useState(5); // Total buffer time
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoBufferRef = useRef<VideoBuffer>({ chunks: [], startTime: 0 });
  
  const { selectedPlayers } = usePlayers();
  
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

    initializeCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start continuous recording for the buffer
  useEffect(() => {
    if (!stream) return;
    
    const startBufferRecording = () => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      videoBufferRef.current = { chunks: [], startTime: Date.now() };
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoBufferRef.current.chunks.push(event.data);
          
          // Maintain buffer size (keep only last X seconds worth of chunks)
          const currentTime = Date.now();
          const bufferDuration = currentTime - videoBufferRef.current.startTime;
          
          // If buffer is larger than 2x our desired size, trim it
          if (bufferDuration > bufferSeconds * 2000) {
            // Start a new buffer with the most recent chunks (about half the buffer)
            const chunksToKeep = videoBufferRef.current.chunks.slice(
              Math.floor(videoBufferRef.current.chunks.length / 2)
            );
            
            videoBufferRef.current = {
              chunks: chunksToKeep,
              startTime: currentTime - (bufferSeconds * 1000)
            };
          }
        }
      };
      
      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
    };
    
    startBufferRecording();
    
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stream, bufferSeconds]);

  const captureClip = async () => {
    if (!mediaRecorderRef.current) return;
    setIsProcessing(true);
    
    try {
      // Continue recording for 2.5 more seconds for the "after" part of the clip
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Stop the recorder
      mediaRecorderRef.current.stop();
      
      // Create the clip from buffer chunks
      const clipBlob = new Blob(videoBufferRef.current.chunks, { type: 'video/webm' });
      setCapturedClip(clipBlob);
      
      toast.success('Clip captured successfully!');
      
      // Restart the buffer recording
      if (stream) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        videoBufferRef.current = { chunks: [], startTime: Date.now() };
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoBufferRef.current.chunks.push(event.data);
          }
        };
        
        mediaRecorder.start(1000);
      }
    } catch (error) {
      console.error('Error capturing clip:', error);
      toast.error('Failed to capture clip');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadClip = async () => {
    if (!capturedClip || selectedPlayers.length === 0) {
      toast.error(selectedPlayers.length === 0 
        ? 'Please select at least one player' 
        : 'No clip to upload');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `clip_${timestamp}.webm`;
      
      // Upload to selected players' folders
      await simulateUploadToMultipleFolders(
        capturedClip,
        selectedPlayers.map(player => ({
          id: player.id,
          name: player.name,
          driveFolder: player.driveFolder
        })),
        fileName,
        'clip' // Added this fourth argument: fileType
      );
      
      toast.success('Clip uploaded successfully!');
      
      // Reset for new clip
      setCapturedClip(null);
    } catch (error) {
      console.error('Error uploading clip:', error);
      toast.error('Failed to upload clip');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted
              />
              
              {isRecording && (
                <div className="absolute top-4 right-4 bg-slate-800/70 text-white px-2 py-1 rounded-lg flex items-center">
                  <div className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
                  Buffer Active
                </div>
              )}
            </div>
            
            <Button 
              onClick={captureClip}
              disabled={!isRecording || isProcessing}
              className="bg-team-primary hover:bg-team-primary/90 text-white rounded-full w-16 h-16 flex items-center justify-center"
            >
              {isProcessing ? (
                <Timer className="h-6 w-6 animate-spin" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
              Press to capture a 5-second clip<br />
              (2.5s before + 2.5s after)
            </p>
          </div>
        </CardContent>
      </Card>

      {capturedClip && (
        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs">
              Clip successfully captured! Select players below and upload the clip to their folders.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleUploadClip} 
            disabled={isProcessing || selectedPlayers.length === 0}
            className="w-full"
          >
            {isProcessing ? 'Uploading...' : 'Upload Clip to Selected Players'}
          </Button>
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Select Players</h3>
        <PlayerList />
      </div>
    </div>
  );
};

export default VideoClipCapture;
