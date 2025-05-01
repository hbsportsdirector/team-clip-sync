// src/components/ClipTrimmer.tsx

import React, { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Slider, Group, Button, Text } from '@mantine/core';

interface ClipTrimmerProps {
  folderId: string;
}

export default function ClipTrimmer({ folderId }: ClipTrimmerProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onLoadedMetadata = () => {
    const dur = videoRef.current?.duration || 0;
    setDuration(dur);
    setStartTime(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoFile(e.target.files?.[0] || null);
    setDuration(0);
    setStartTime(0);
  };

  const handleTrimAndUpload = async () => {
    if (!videoFile) {
      toast.error('Select a video first.');
      return;
    }
    if (!folderId) {
      toast.error('No player folder selected.');
      return;
    }

    setProcessing(true);
    toast.loading('Trimming & uploading...');
    try {
      const form = new FormData();
      form.append('folderId', folderId);
      form.append('startTime', startTime.toString());
      form.append('video', videoFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/trim-upload`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Trim upload failed');
      }
      const { fileId } = await res.json();
      toast.dismiss();
      toast.success(`Trimmed & uploaded! ID: ${fileId}`);
    } catch (err: any) {
      console.error(err);
      toast.dismiss();
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-lg font-semibold">Trim & Upload a 5s Clip</h2>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-700"
      />
      {videoFile && (
        <video
          ref={videoRef}
          src={URL.createObjectURL(videoFile)}
          controls
          onLoadedMetadata={onLoadedMetadata}
          className="w-full max-h-60 rounded"
        />
      )}
      {duration > 5 && (
        <div>
          <label className="block mb-1">
            Start time: {startTime.toFixed(1)}s
          </label>
          <input
            type="range"
            min={0}
            max={duration - 5}
            step={0.1}
            value={startTime}
            onChange={(e) => setStartTime(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
      <button
        onClick={handleTrimAndUpload}
        disabled={!videoFile || processing}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {processing ? 'Processing…' : 'Trim & Upload'}
      </button>
    </div>
  );
}
