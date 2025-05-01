// server/googleDrive.js

import { google } from 'googleapis';
import fs from 'fs';

// Load credentials from environment
const KEYFILE = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!KEYFILE || !fs.existsSync(KEYFILE)) {
  throw new Error(`Google service account file not found at ${KEYFILE}`);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

/**
 * Create a per-player folder under the configured parent and share it.
 * @param {string} playerEmail
 * @returns {Promise<string>} the new folder ID
 */
export async function createPlayerFolder(playerEmail) {
  // 1) create the folder
  const res = await drive.files.create({
    requestBody: {
      name: playerEmail,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID],
    },
    fields: 'id',
  });
  const folderId = res.data.id;

  // 2) share it with the player
  await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: 'user',
      role: 'writer',
      emailAddress: playerEmail,
    },
    sendNotificationEmail: true,
  });

  return folderId;
}

/**
 * Upload a video buffer to a specific Drive folder.
 * @param {string} folderId
 * @param {string} fileName
 * @param {Buffer} fileBuffer
 * @returns {Promise<string>} the new file ID
 */
export async function uploadVideoToDrive(folderId, fileName, fileBuffer) {
  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
      mimeType: 'video/mp4',
    },
    media: {
      mimeType: 'video/mp4',
      body: fileBuffer,
    },
    fields: 'id',
  });
  return res.data.id;
}
