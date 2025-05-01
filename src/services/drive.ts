// src/services/drive.ts

import { supabase } from '../integrations/supabase/client';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * List the first 10 files in the user's Google Drive.
 */
export async function listDriveFiles(): Promise<DriveFile[]> {
  // 1) Get the current session and its Google access token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.provider_token) {
    throw new Error('No Google access token found. Make sure you’re logged in.');
  }

  // 2) Call the Drive API
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType)',
    {
      headers: {
        Authorization: `Bearer ${session.provider_token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive API error: ${text}`);
  }

  const body = await res.json();
  return body.files;
}
