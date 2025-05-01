// src/utils/api.ts

/**
 * uploadClip
 *
 * Uploads a File object to your backend /upload endpoint.
 * Expects a VITE_API_URL env var set to http://localhost:4000
 *
 * @param file     The video file (e.g. from an <input type="file">)
 * @param folderId The Drive folder ID to upload into
 * @returns        The Drive fileId of the uploaded video
 */
export async function uploadClip(
    file: File,
    folderId: string
  ): Promise<string> {
    // Build form payload
    const form = new FormData();
    form.append('folderId', folderId);
    form.append('video', file);
  
    // POST to your backend
    const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
      method: 'POST',
      body: form,
    });
  
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Upload failed');
    }
  
    const { fileId } = (await res.json()) as { fileId: string };
    return fileId;
  }
  