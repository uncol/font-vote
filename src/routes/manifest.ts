import { Router } from 'express';

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
    console.error('Failed to fetch manifest from CDN:', error);
    res.status(500).json({ error: 'Failed to load manifest from CDN' });
  }
});

export default router;
