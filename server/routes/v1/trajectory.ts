import { Router } from 'express';
import { getTrajectory, getCacheInfo } from '../../data/trajectory-cache';
import { MISSION_START, MISSION_END } from '../../data/constants';

export const trajectoryRouter = Router();

trajectoryRouter.get('/', async (req, res) => {
  try {
    const startParam = req.query.start as string | undefined;
    const stopParam = req.query.stop as string | undefined;
    const stepParam = req.query.step as string | undefined;

    const trajectory = await getTrajectory();
    const cacheInfo = getCacheInfo();

    let points = trajectory;

    // Filter by time range
    if (startParam || stopParam) {
      const startEpoch = startParam ? new Date(startParam).getTime() : MISSION_START.getTime();
      const stopEpoch = stopParam ? new Date(stopParam).getTime() : MISSION_END.getTime();
      points = points.filter((p) => p.epoch >= startEpoch && p.epoch <= stopEpoch);
    }

    // Downsample by step
    if (stepParam && points.length > 0) {
      const stepMs = parseStep(stepParam);
      if (stepMs && stepMs > 0) {
        const sampled = [points[0]];
        let lastEpoch = points[0].epoch;
        for (let i = 1; i < points.length; i++) {
          if (points[i].epoch - lastEpoch >= stepMs) {
            sampled.push(points[i]);
            lastEpoch = points[i].epoch;
          }
        }
        points = sampled;
      }
    }

    res.json({
      points: points.map((p) => ({
        t: new Date(p.epoch).toISOString(),
        x: p.x,
        y: p.y,
        z: p.z,
        vx: p.vx,
        vy: p.vy,
        vz: p.vz,
      })),
      count: points.length,
      interpolation: 'hermite',
      source: 'horizons_cached',
      cache_age_seconds: cacheInfo.age_seconds,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

function parseStep(step: string): number | null {
  const match = step.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  switch (match[2]) {
    case 'm': return val * 60 * 1000;
    case 'h': return val * 3600 * 1000;
    case 'd': return val * 86400 * 1000;
    default: return null;
  }
}
