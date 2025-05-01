// src/components/VideoUploader.tsx

import React, { useState } from 'react';
import { uploadClip } from '../utils/api';
import toast from 'react-hot-toast';

interface VideoUploaderProps {
  folderId: string;
}

export default function VideoUploader({ folderId }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Select a video file first.');
      return;
    }
    if (!folderId) {
      toast.error('No player folder selected.');
      return;
    }

    setUploading(true);
    toast.loading('Uploading...');
    try {
      const fileId = await uploadClip(file, folderId);
      toast.dismiss();
      toast.success(`Uploaded! File ID: ${fileId}`);
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h2 className="text-lg font-semibold">Upload a Video File</h2>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-700"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className={`px-4 py-2 rounded text-white ${
          uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {uploading ? 'Uploading…' : 'Upload to Drive'}
      </button>
    </div>
  );
}
