import { Router } from 'express';
import { cacheGet, cacheSet } from '../../cache';

export const weatherRouter = Router();

const SWPC_BASE = 'https://services.swpc.noaa.gov/products';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

weatherRouter.get('/', async (_req, res) => {
  try {
    const key = 'space-weather';
    const cached = cacheGet(key);
    if (cached) return res.json(cached);

    const [plasmaRes, magRes, kpRes] = await Promise.all([
      fetch(`${SWPC_BASE}/solar-wind/plasma-2-hour.json`),
      fetch(`${SWPC_BASE}/solar-wind/mag-2-hour.json`),
      fetch(`${SWPC_BASE}/noaa-planetary-k-index.json`),
    ]);

    if (!plasmaRes.ok || !magRes.ok || !kpRes.ok) {
      throw new Error('SWPC fetch failed');
    }

    const [plasmaRaw, magRaw, kpRaw] = await Promise.all([
      plasmaRes.json(),
      magRes.json(),
      kpRes.json(),
    ]);

    // Parse plasma: [header, ...rows] where row = [time, density, speed, temp]
    const plasma = (plasmaRaw as string[][]).slice(1).slice(-12).map((r) => ({
      time: r[0],
      density: parseFloat(r[1]) || null,
      speed: parseFloat(r[2]) || null,
      temperature: parseFloat(r[3]) || null,
    }));

    // Parse mag: [header, ...rows] where row = [time, bx, by, bz, lon, lat, bt]
    const mag = (magRaw as string[][]).slice(1).slice(-12).map((r) => ({
      time: r[0],
      bt: parseFloat(r[6]) || null,
      bz: parseFloat(r[3]) || null,
    }));

    // Parse Kp: [header, ...rows] where row = [time, kp, kp_color, ...]
    const kpData = (kpRaw as string[][]).slice(1);
    const latestKp = kpData[kpData.length - 1];

    const result = {
      solar_wind: { plasma: plasma.slice(-6), magnetic_field: mag.slice(-6) },
      kp_index: latestKp ? { time: latestKp[0], kp: parseFloat(latestKp[1]), level: kpLevel(parseFloat(latestKp[1])) } : null,
      updated: new Date().toISOString(),
    };

    cacheSet(key, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

function kpLevel(kp: number): string {
  if (kp < 4) return 'quiet';
  if (kp < 5) return 'unsettled';
  if (kp < 6) return 'storm';
  if (kp < 7) return 'strong_storm';
  return 'severe_storm';
}
