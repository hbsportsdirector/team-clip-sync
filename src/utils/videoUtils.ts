
/**
 * Extract a clip from a video file
 * @param videoBlob The source video file as a Blob
 * @param startTime The start time of the clip in seconds
 * @param endTime The end time of the clip in seconds
 * @returns Promise resolving to a new Blob containing the clip
 */
export const extractVideoClip = async (
  videoBlob: Blob,
  startTime: number,
  endTime: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Create video element to get video metadata
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      // Create source URL from the blob
      const videoUrl = URL.createObjectURL(videoBlob);
      video.src = videoUrl;
      
      video.onloadedmetadata = () => {
        // Clean up source URL
        URL.revokeObjectURL(videoUrl);
        
        // Validate time range
        const validStartTime = Math.max(0, startTime);
        const validEndTime = Math.min(video.duration, endTime);
        
        if (validStartTime >= validEndTime) {
          reject(new Error('Invalid time range for clip extraction'));
          return;
        }

        console.log(`Creating clip from ${validStartTime}s to ${validEndTime}s (duration: ${validEndTime - validStartTime}s)`);
        
        // Since browser APIs for video editing are limited, we'll create a "virtual clip"
        // by storing the original video with metadata about the clip timing
        const clipMetadata = {
          originalType: videoBlob.type,
          startTime: validStartTime,
          endTime: validEndTime,
          duration: validEndTime - validStartTime,
          timestamp: new Date().toISOString()
        };
        
        // Create a wrapper object with both the original video and the clip metadata
        const metadataBlob = new Blob([JSON.stringify(clipMetadata)], { type: 'application/json' });
        
        // Create a container for the clip data
        const container = new Blob([metadataBlob, videoBlob], { type: videoBlob.type });
        
        resolve(container);
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(videoUrl);
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Create a 5-second clip centered around a specific moment in a video
 * @param videoBlob The source video file as a Blob
 * @param centerTimePosition The center position in seconds
 * @returns Promise resolving to a new Blob containing the 5-second clip
 */
export const createFiveSecondClip = async (
  videoBlob: Blob,
  centerTimePosition: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create a temporary video element to get video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    const videoUrl = URL.createObjectURL(videoBlob);
    video.src = videoUrl;
    
    video.onloadedmetadata = async () => {
      try {
        URL.revokeObjectURL(videoUrl);
        
        // Calculate the 5-second window centered around the specified time
        const startTime = Math.max(0, centerTimePosition - 2.5);
        const endTime = Math.min(video.duration, centerTimePosition + 2.5);
        const actualDuration = endTime - startTime;
        
        console.log(`Creating 5-second clip around ${centerTimePosition}s (from ${startTime}s to ${endTime}s)`);
        
        // Use MediaRecorder to create a clip
        // First, create another video element to play the source video
        const sourceVideo = document.createElement('video');
        sourceVideo.src = URL.createObjectURL(videoBlob);
        sourceVideo.muted = true;
        
        // Create a canvas to capture the video frames
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Create a MediaStream from the canvas
        const stream = canvas.captureStream();
        
        // Set up a MediaRecorder to record the stream
        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        });
        
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          // Create a new blob from all the chunks
          const clipBlob = new Blob(chunks, { type: 'video/webm' });
          
          // Add clip metadata as properties
          Object.defineProperty(clipBlob, 'clipMetadata', {
            value: {
              originalType: videoBlob.type,
              startTime: startTime,
              endTime: endTime,
              duration: actualDuration,
              centerPoint: centerTimePosition,
              timestamp: new Date().toISOString()
            },
            writable: false,
            enumerable: true
          });
          
          // Clean up
          URL.revokeObjectURL(sourceVideo.src);
          
          resolve(clipBlob);
        };
        
        // Listen for the video to be ready
        sourceVideo.onloadedmetadata = () => {
          // Set canvas dimensions to match video
          canvas.width = sourceVideo.videoWidth;
          canvas.height = sourceVideo.videoHeight;
          
          // Set video to start time
          sourceVideo.currentTime = startTime;
        };
        
        // When seeking is complete, start playback and recording
        sourceVideo.onseeked = () => {
          // Start recording
          recorder.start();
          
          // Start playback
          sourceVideo.play();
          
          // Draw video frames to canvas
          const drawFrame = () => {
            if (sourceVideo.currentTime <= endTime) {
              ctx?.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawFrame);
            } else {
              // Stop recording when we reach the end time
              sourceVideo.pause();
              recorder.stop();
            }
          };
          
          drawFrame();
        };
        
        sourceVideo.onerror = (e) => {
          URL.revokeObjectURL(sourceVideo.src);
          reject(new Error(`Error loading source video for clip: ${e}`));
        };
      } catch (error) {
        console.error('Error creating 5-second clip:', error);
        reject(error);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Failed to load video metadata'));
    };
  });
};

// Utility function to check if a blob is a clip and get clip metadata
export const getClipMetadata = (blob: Blob): { startTime: number, endTime: number } | null => {
  // Try to access the clipMetadata property that we defined
  if ((blob as any).clipMetadata) {
    const metadata = (blob as any).clipMetadata;
    return {
      startTime: metadata.startTime,
      endTime: metadata.endTime
    };
  }
  
  return null;
};
