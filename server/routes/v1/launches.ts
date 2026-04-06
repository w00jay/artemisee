import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const launchesRouter = Router();

const LL2_BASE = 'https://ll.thespacedevs.com/2.2.0';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

launchesRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 10);
    const key = `launches:${limit}`;

    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const resp = await fetch(`${LL2_BASE}/launch/upcoming/?limit=${limit}&mode=list`);
    if (!resp.ok) throw new Error(`LL2 HTTP ${resp.status}`);
    const json = await resp.json();

    const launches = json.results.map((l: Record<string, unknown>) => ({
      name: l.name,
      net: l.net,
      status: (l.status as Record<string, unknown>)?.name,
      pad: l.pad,
      image: l.image,
    }));

    const result = { launches, count: launches.length };
    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
