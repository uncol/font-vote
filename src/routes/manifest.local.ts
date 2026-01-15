import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Read manifest from local file system (public/manifest.json)
    const manifestPath = join(process.cwd(), 'public', 'manifest.json');
    const fileContent = await readFile(manifestPath, 'utf-8');
    const data = JSON.parse(fileContent) as Record<string, unknown>;
    res.json(data);
  } catch (error) {
    console.error('Failed to load local manifest:', error);
    res.status(500).json({ error: 'Failed to load manifest' });
  }
});

export default router;
