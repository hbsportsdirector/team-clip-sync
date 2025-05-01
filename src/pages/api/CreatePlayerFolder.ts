// pages/api/createPlayerFolder.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { createPlayerFolder } from '../../server/googleDrive';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { playerEmail } = req.body;
    if (!playerEmail || typeof playerEmail !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid playerEmail' });
    }

    const folderId = await createPlayerFolder(playerEmail);
    res.status(200).json({ folderId });
  } catch (err: any) {
    console.error('Error creating player folder:', err);
    res.status(500).json({ error: err.message });
  }
}
