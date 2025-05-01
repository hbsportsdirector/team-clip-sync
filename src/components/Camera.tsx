// src/components/Camera.tsx

import React, { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Play, StopCircle } from 'lucide-react';
import { usePlayers } from '../contexts/PlayerContext';
import { uploadClip } from '../utils/api';
import { notifications } from '@mantine/notifications';

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const { players } = usePlayers();

  const [checking, setChecking] = useState(true);
  const [cameraAvailable, setCameraAvailable] = useState(false);

  useEffect(() => {
    let streamRef: MediaStream | null = null;

    async function setupCamera() {
      try {
        // 1) Request camera access directly
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef = stream;

        // 2) Hook up preview
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 3) Prepare recorder
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = async (event: BlobEvent) => {
          const blob = new Blob([event.data], { type: 'video/mp4' });
          if (!selectedPlayerId) {
            notifications.show({ title: 'Error', message: 'Select a player first.', color: 'red' });
            return;
          }
          const player = players.find((p) => p.id === selectedPlayerId);
          if (!player) {
            notifications.show({ title: 'Error', message: 'Player not found.', color: 'red' });
            return;
          }

          const notifId = notifications.show({ title: 'Uploading…', message: 'Sending clip', loading: true });
          try {
            const file = new File([blob], `clip_${Date.now()}.mp4`, { type: 'video/mp4' });
            const fileId = await uploadClip(file, player.driveFolder);
            notifications.update({ id: notifId, title: 'Success', message: `Sent! ${fileId}`, color: 'green', loading: false });
          } catch (err: any) {
            notifications.update({ id: notifId, title: 'Upload failed', message: err.message||'Error', color: 'red', loading: false });
          }
        };
        setMediaRecorder(mr);
        setCameraAvailable(true);
      } catch (err) {
        console.error('Camera setup error:', err);
        setCameraAvailable(false);
      } finally {
        setChecking(false);
      }
    }

    setupCamera();

    return () => {
      // cleanup: stop camera tracks
      if (streamRef) {
        streamRef.getTracks().forEach((t) => t.stop());
      }
    };
  }, [players, selectedPlayerId]);

  if (checking) {
    return <div className="text-gray-500">Checking camera…</div>;
  }

  if (!cameraAvailable) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800 font-medium">
          ⚠️ No camera detected or permission denied.
        </p>
      </div>
    );
  }

  const startRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.start();
    setRecording(true);
  };
  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Record & Send Video</h2>

      <select
        value={selectedPlayerId}
        onChange={(e) => setSelectedPlayerId(e.target.value)}
        className="w-full px-3 py-2 border rounded"
      >
        <option value="">— Select Player —</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <video ref={videoRef} autoPlay muted className="w-full max-h-64 rounded bg-black" />

      <div className="flex justify-center space-x-4">
        <Button onClick={startRecording} disabled={recording} className="flex items-center space-x-2">
          <Play />
          <span>Record</span>
        </Button>
        <Button onClick={stopRecording} disabled={!recording} className="flex items-center space-x-2">
          <StopCircle />
          <span>Stop</span>
        </Button>
      </div>
    </div>
  );
}
