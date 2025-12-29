import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/', async (req, res) => {
  try {
    const response = await fetch('https://gf.cdn.gufolabs.com/latest/manifest.json');
    if (!response.ok) {
      throw new Error(`CDN returned ${response.status}`);
    }
    const data = await response.json() as Record<string, unknown>;
    res.json(data);
  } catch (error) {
    console.warn('Failed to fetch manifest from CDN, falling back to local:', error);
    try {
      const localPath = path.join(__dirname, '..', '..', 'public', 'manifest.json');
      const localData = await fs.readFile(localPath, 'utf-8');
      res.json(JSON.parse(localData));
    } catch (fallbackError) {
      console.error('Failed to load local manifest:', fallbackError);
      res.status(500).json({ error: 'Failed to load manifest from both CDN and local storage' });
    }
  }
});

export default router;
