import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const apodRouter = Router();

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

apodRouter.get('/', async (_req, res) => {
  try {
    const key = 'apod';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const resp = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    if (!resp.ok) throw new Error(`NASA APOD HTTP ${resp.status}`);
    const json = await resp.json();

    const result = {
      title: json.title,
      explanation: json.explanation,
      url: json.url,
      hdurl: json.hdurl,
      media_type: json.media_type,
      date: json.date,
      copyright: json.copyright || null,
    };

    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
