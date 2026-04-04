import { Router } from 'express';
import { cacheGet, cacheSet } from '../cache';

const TTL_MS = 30 * 60 * 1000; // 30 min during active mission

export const horizonsRouter = Router();

horizonsRouter.get('/', async (req, res) => {
  try {
    const params = new URLSearchParams(
      req.query as Record<string, string>,
    );
    const key = params.toString();

    const cached = cacheGet(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const jplUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
    console.log('[horizons] Fetching:', jplUrl);
    const jpl = await fetch(jplUrl);
    const data = await jpl.json();

    if (data.error) {
      console.error('[horizons] JPL error:', data.error);
      return res.status(502).json({ error: data.error });
    }

    cacheSet(key, data, TTL_MS);
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
