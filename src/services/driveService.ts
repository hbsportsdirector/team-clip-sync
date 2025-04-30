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

  try {
    const fileIds: string[] = [];
    
    // Upload file to each folder
    for (const folderId of folderIds) {
      if (!folderId) continue;
      
      // Create a multipart request to upload the file
      const metadata = {
        name: fileName,
        mimeType: videoBlob.type,
        parents: [folderId]
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', videoBlob);
      
      // Upload directly to Google Drive API
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Drive upload error:', errorText);
        throw new Error(`Failed to upload to Google Drive: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      fileIds.push(result.id);
      
      console.log(`Successfully uploaded file to folder ${folderId}, received file ID: ${result.id}`);
    }
    
    return fileIds;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
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

export const uploadToSelectedDriveFolders = async (
  videoBlob: Blob,
  players: { id: string, name: string, driveFolder: string }[],
  fileName: string,
  accessToken: string | null
): Promise<void> => {
  try {
    // Upload to Supabase Storage first
    toast.info("Processing video...");
    const filePath = await uploadVideoToSupabase(videoBlob, fileName);
    
    // Save recording to database
    const recordingId = await saveRecordingToDatabase(filePath, fileName, players);
    
    if (!accessToken) {
      toast.warning("Not logged in with Google. Videos saved to your account but not uploaded to Google Drive.");
      return;
    }
    
    // Get valid folder IDs (non-empty)
    const validPlayers = players.filter(player => player.driveFolder && player.driveFolder !== 'mock-folder');
    
    if (validPlayers.length === 0) {
      toast.info("No Google Drive folders configured. Videos saved to your account only.");
      return;
    }
    
    // Upload to Google Drive for each player
    toast.info(`Uploading to ${validPlayers.length} Google Drive folders...`);
    
    const folderIds = validPlayers.map(player => player.driveFolder);
    const fileIds = await uploadToGoogleDrive(videoBlob, folderIds, fileName, accessToken);
    
    // Update database with file IDs
    const updates = validPlayers.map((player, index) => ({
      player_id: player.id,
      recording_id: recordingId,
      drive_file_id: fileIds[index] || null,
      drive_status: fileIds[index] ? 'completed' : 'failed'
    }));
    
    if (updates.length > 0) {
      await supabase
        .from('player_recordings')
        .upsert(updates, { onConflict: 'player_id, recording_id' });
    }
    
    toast.success(`Video successfully uploaded to ${fileIds.length} Google Drive folder${fileIds.length !== 1 ? 's' : ''}`);
  } catch (error: any) {
    console.error("Upload error:", error);
    toast.error(error.message || "Failed to upload video");
  }
};

// Keep the simulateUploadToMultipleFolders function for backwards compatibility
export const simulateUploadToMultipleFolders = uploadToSelectedDriveFolders;
