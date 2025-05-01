// server/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { uploadVideoToDrive, createPlayerFolder } from './googleDrive.js';

// Point fluent-ffmpeg at the installed binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();

// CORS so your React app (8080) can call these endpoints
app.use(
  cors({
    origin: 'http://localhost:8080',
  })
);

app.use(express.json());
app.use(
  fileUpload({
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
    abortOnLimit: true,
  })
);

// In-memory players store (swap for a real DB later)
let players = [];

/**
 * Health check
 */
app.get('/', (req, res) => {
  res.send('🏃‍♂️ API is running');
});

/**
 * GET /players
 * Returns the list of players for this coach.
 */
app.get('/players', (req, res) => {
  res.json(players);
});

/**
 * POST /players
 * Body: { email: string }
 * Creates a Drive folder for the player, shares it, and adds to the store.
 */
app.post('/players', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    // 1) Create & share the folder in Google Drive
    const folderId = await createPlayerFolder(email);

    // 2) Add to our in-memory list
    const player = { id: uuidv4(), name: email, driveFolder: folderId };
    players.push(player);

    // 3) Return the new player object
    res.json(player);
  } catch (err) {
    console.error('Create player error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /upload
 * Body (form-data):
 *   - folderId: string
 *   - video: file
 * Uploads a full video to the specified Drive folder.
 */
app.post('/upload', async (req, res) => {
  try {
    const { folderId } = req.body;
    if (!folderId) {
      return res.status(400).json({ error: 'Missing folderId' });
    }
    const video = req.files?.video;
    if (!video) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const fileId = await uploadVideoToDrive(
      folderId,
      video.name,
      video.data
    );
    res.json({ fileId });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /trim-upload
 * Body (form-data):
 *   - folderId: string
 *   - startTime: number (seconds)
 *   - video: file
 * Trims a 5-second clip starting at `startTime` and uploads it.
 */
app.post('/trim-upload', async (req, res) => {
  try {
    const { folderId, startTime } = req.body;
    if (!folderId || startTime == null) {
      return res
        .status(400)
        .json({ error: 'Missing folderId or startTime' });
    }
    const video = req.files?.video;
    if (!video) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Write incoming buffer to temp file
    const inputPath = path.join(
      os.tmpdir(),
      `in-${Date.now()}.mp4`
    );
    fs.writeFileSync(inputPath, video.data);

    // Trim out a 5-second clip
    const outputPath = path.join(
      os.tmpdir(),
      `out-${Date.now()}.mp4`
    );
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(Number(startTime))
        .setDuration(5)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // Read trimmed clip and upload
    const trimmedBuffer = fs.readFileSync(outputPath);
    const clipName = `clip_${Date.now()}.mp4`;
    const fileId = await uploadVideoToDrive(
      folderId,
      clipName,
      trimmedBuffer
    );

    // Cleanup temp files
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.json({ fileId });
  } catch (err) {
    console.error('Trim-upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server on port 4000 (or override via PORT in .env)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
