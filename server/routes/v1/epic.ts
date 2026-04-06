import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const epicRouter = Router();

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

epicRouter.get('/', async (_req, res) => {
  try {
    const key = 'epic';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const resp = await fetch(`https://api.nasa.gov/EPIC/api/natural?api_key=${NASA_API_KEY}`);
    if (!resp.ok) throw new Error(`EPIC HTTP ${resp.status}`);
    const images = await resp.json();

    // Take the most recent image
    const latest = images[0];
    if (!latest) {
      res.json({ image: null });
      return;
    }

    // Build image URL: https://epic.gsfc.nasa.gov/archive/natural/YYYY/MM/DD/png/image_name.png
    const date = latest.date.split(' ')[0].replaceAll('-', '/');
    const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${date}/png/${latest.image}.png`;

    const result = {
      image: {
        url: imageUrl,
        caption: latest.caption,
        date: latest.date,
        lat: latest.centroid_coordinates?.lat,
        lon: latest.centroid_coordinates?.lon,
      },
      total_available: images.length,
    };

    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
