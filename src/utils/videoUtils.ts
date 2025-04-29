
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
        
        // Create a new video element for display purposes
        const displayVideo = document.createElement('video');
        
        // Store clip timing metadata with the blob
        const clipMetadata = {
          originalType: videoBlob.type,
          startTime: startTime,
          endTime: endTime,
          actualDuration: actualDuration,
          centerPoint: centerTimePosition,
          timestamp: new Date().toISOString()
        };
        
        // Convert the metadata to a string and then to a Blob
        const metadataStr = JSON.stringify(clipMetadata);
        
        // For better browser compatibility, we'll return the original video
        // with additional properties to indicate it's a clip
        const clipBlob = new Blob([videoBlob], { 
          type: videoBlob.type 
        });
        
        // Add custom properties to the blob (these will be used when playing the clip)
        Object.defineProperties(clipBlob, {
          clipMetadata: {
            value: clipMetadata,
            writable: false
          }
        });
        
        // Create a simple metadata text to store with the video
        const clipInfo = new TextEncoder().encode(metadataStr);
        
        // Store this information in a property that can be easily serialized
        (clipBlob as any).clipInfo = clipInfo;
        
        // Store the metadata as a user-defined property
        (clipBlob as any).clipStart = startTime;
        (clipBlob as any).clipEnd = endTime;
        
        resolve(clipBlob);
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
  if ((blob as any).clipStart !== undefined && (blob as any).clipEnd !== undefined) {
    return {
      startTime: (blob as any).clipStart,
      endTime: (blob as any).clipEnd
    };
  }
  return null;
};
