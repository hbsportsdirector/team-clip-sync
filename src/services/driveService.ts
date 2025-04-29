
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const uploadVideoToSupabase = async (
  videoBlob: Blob,
  fileName: string
): Promise<string> => {
  try {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(`uploads/${fileName}`, videoBlob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    
    return data.path;
  } catch (error: any) {
    console.error('Error uploading to storage:', error);
    throw error;
  }
};

export const uploadToGoogleDrive = async (
  videoBlob: Blob,
  folderIds: string[],
  fileName: string,
  accessToken: string | null
): Promise<string[]> => {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  // For now, we'll simulate the upload since we don't have full Google Drive integration yet
  console.log(`Uploading video to ${folderIds.length} folders:`, folderIds);
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create mock file IDs for each folder
  const fileIds = folderIds.map(folderId => `mock-file-id-${Date.now()}-${folderId}`);
  
  return fileIds;
};

export const getGoogleDriveFolderLink = (folderId: string): string => {
  return `https://drive.google.com/drive/folders/${folderId}`;
};

export const saveRecordingToDatabase = async (
  filePath: string,
  title: string,
  selectedPlayers: { id: string, name: string, driveFolder: string }[]
): Promise<string> => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Insert the recording with the user_id
  const { data: recordingData, error: recordingError } = await supabase
    .from('recordings')
    .insert({
      file_path: filePath,
      title: title || `Recording ${new Date().toISOString()}`,
      user_id: user.id
    })
    .select()
    .single();

  if (recordingError) {
    throw recordingError;
  }

  const recordingId = recordingData.id;

  // Create player_recordings entries
  const playerRecordings = selectedPlayers.map(player => ({
    player_id: player.id,
    recording_id: recordingId,
    drive_status: 'pending'
  }));

  const { error: linkError } = await supabase
    .from('player_recordings')
    .insert(playerRecordings);

  if (linkError) {
    throw linkError;
  }

  return recordingId;
};

export const simulateUploadToMultipleFolders = async (
  videoBlob: Blob,
  players: { id: string, name: string, driveFolder: string }[],
  fileName: string
): Promise<void> => {
  try {
    // Upload to Supabase Storage first
    toast.info("Processing video...");
    const filePath = await uploadVideoToSupabase(videoBlob, fileName);
    
    // Save recording to database
    await saveRecordingToDatabase(filePath, fileName, players);
    
    // Simulate upload for each player
    for (const player of players) {
      toast.info(`Uploading video for ${player.name}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    toast.success(`Video successfully uploaded to ${players.length} folder${players.length > 1 ? 's' : ''}`);
  } catch (error: any) {
    console.error("Upload error:", error);
    toast.error(error.message || "Failed to upload video");
  }
};
