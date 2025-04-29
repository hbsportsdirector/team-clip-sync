
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

        // Create a MediaSource and add the video data
        const mediaSource = new MediaSource();
        const sourceUrl = URL.createObjectURL(mediaSource);
        
        mediaSource.addEventListener('sourceopen', async () => {
          try {
            // Create buffer for the video data
            const sourceBuffer = mediaSource.addSourceBuffer(videoBlob.type);
            
            // Read the video data into the buffer
            const arrayBuffer = await videoBlob.arrayBuffer();
            sourceBuffer.appendBuffer(arrayBuffer);
            
            // Once the buffer is updated, extract the clip
            sourceBuffer.addEventListener('updateend', () => {
              try {
                mediaSource.endOfStream();
                
                // Create a MediaRecorder to capture the clip
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const clipVideo = document.createElement('video');
                
                clipVideo.src = sourceUrl;
                clipVideo.currentTime = validStartTime;
                
                clipVideo.onloadedmetadata = () => {
                  canvas.width = clipVideo.videoWidth;
                  canvas.height = clipVideo.videoHeight;
                  
                  const stream = canvas.captureStream();
                  const recorder = new MediaRecorder(stream, {
                    mimeType: videoBlob.type
                  });
                  
                  const chunks: BlobPart[] = [];
                  recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                      chunks.push(e.data);
                    }
                  };
                  
                  recorder.onstop = () => {
                    const clipBlob = new Blob(chunks, { type: videoBlob.type });
                    URL.revokeObjectURL(sourceUrl);
                    resolve(clipBlob);
                  };
                  
                  recorder.start();
                  
                  // Draw video frames to canvas at regular intervals
                  const drawFrame = () => {
                    if (clipVideo.currentTime < validEndTime) {
                      ctx!.drawImage(clipVideo, 0, 0);
                      clipVideo.currentTime += 1/30; // 30fps
                      requestAnimationFrame(drawFrame);
                    } else {
                      recorder.stop();
                    }
                  };
                  
                  drawFrame();
                };
              } catch (error) {
                reject(error);
              }
            });
          } catch (error) {
            reject(error);
          }
        });
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
 * A simpler approach using the Web Video Editor API
 * Note: This API is experimental and may not be available in all browsers
 * This serves as a fallback for modern browsers that support it
 */
export const extractClipUsingVideoEditor = async (
  videoBlob: Blob,
  startTime: number,
  endTime: number
): Promise<Blob> => {
  // Check if VideoFrame API is available (part of WebCodecs)
  if ('VideoFrame' in window) {
    try {
      // Create a File from Blob to work with MediaSource
      const videoFile = new File([videoBlob], 'video.mp4', { type: videoBlob.type });
      
      // Use FFmpeg.wasm or other client-side video editing libraries
      // This requires additional dependencies and is complex to implement here
      
      // For now, use a fallback method or inform about browser support
      throw new Error('Advanced video editing not supported in this browser version');
    } catch (error) {
      console.error('Web Video Editor fallback failed:', error);
      throw error;
    }
  } else {
    throw new Error('Web Video Editor API not supported in this browser');
  }
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
  const startTime = Math.max(0, centerTimePosition - 2.5);
  const endTime = centerTimePosition + 2.5;
  
  try {
    // Create a temporary video element to get video duration
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return new Promise((resolve, reject) => {
      video.onloadedmetadata = async () => {
        try {
          URL.revokeObjectURL(videoUrl);
          const validEndTime = Math.min(video.duration, endTime);
          
          // First try with experimental API
          try {
            const clipBlob = await extractClipUsingVideoEditor(videoBlob, startTime, validEndTime);
            resolve(clipBlob);
          } catch (error) {
            // Fall back to canvas-based approach
            const clipBlob = await extractVideoClip(videoBlob, startTime, validEndTime);
            resolve(clipBlob);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(videoUrl);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = videoUrl;
    });
  } catch (error) {
    console.error('Failed to create 5-second clip:', error);
    throw error;
  }
};
