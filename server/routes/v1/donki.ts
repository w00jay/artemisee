import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const donkiRouter = Router();

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const DONKI_BASE = 'https://api.nasa.gov/DONKI';
const CACHE_TTL = 15 * 60 * 1000; // 15 min

donkiRouter.get('/', async (_req, res) => {
  try {
    const key = 'donki';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    // Fetch last 7 days of notifications
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400 * 1000);
    const startDate = weekAgo.toISOString().slice(0, 10);

    const [cmeRes, flareRes, stormRes] = await Promise.all([
      fetch(`${DONKI_BASE}/CME?startDate=${startDate}&api_key=${NASA_API_KEY}`),
      fetch(`${DONKI_BASE}/FLR?startDate=${startDate}&api_key=${NASA_API_KEY}`),
      fetch(`${DONKI_BASE}/GST?startDate=${startDate}&api_key=${NASA_API_KEY}`),
    ]);

    if (!cmeRes.ok || !flareRes.ok || !stormRes.ok) {
      throw new Error('DONKI fetch failed');
    }

    const [cmes, flares, storms] = await Promise.all([
      cmeRes.json(),
      flareRes.json(),
      stormRes.json(),
    ]);

    const result = {
      cme_count: Array.isArray(cmes) ? cmes.length : 0,
      flare_count: Array.isArray(flares) ? flares.length : 0,
      storm_count: Array.isArray(storms) ? storms.length : 0,
      recent_cmes: (Array.isArray(cmes) ? cmes : []).slice(-3).map((c: Record<string, unknown>) => ({
        time: c.startTime,
        type: c.activityID,
        note: typeof c.note === 'string' ? c.note.slice(0, 200) : null,
      })),
      recent_flares: (Array.isArray(flares) ? flares : []).slice(-3).map((f: Record<string, unknown>) => ({
        time: f.beginTime,
        class: f.classType,
        peak: f.peakTime,
      })),
      recent_storms: (Array.isArray(storms) ? storms : []).slice(-3).map((s: Record<string, unknown>) => ({
        time: s.startTime,
        kp_index: Array.isArray(s.allKpIndex) ? (s.allKpIndex as Record<string, unknown>[]).map((k) => k.kpIndex) : [],
      })),
      period: { start: startDate, end: now.toISOString().slice(0, 10) },
    };

    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
