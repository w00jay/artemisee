import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const issRouter = Router();

const CACHE_TTL = 10 * 1000; // 10 sec — ISS moves fast

issRouter.get('/', async (_req, res) => {
  try {
    const key = 'iss';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const resp = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!resp.ok) throw new Error(`ISS API HTTP ${resp.status}`);
    const data = await resp.json();

    const result = {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude_km: data.altitude,
      velocity_kms: data.velocity / 3600, // km/h → km/s
      timestamp: data.timestamp,
      visibility: data.visibility,
    };

    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
