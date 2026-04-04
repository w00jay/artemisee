import { Router } from 'express';
import { GeoMoon, KM_PER_AU } from 'astronomy-engine';
import { getTrajectory } from '../../data/trajectory-cache';
import { hermiteInterpolate } from '../../data/interpolate';
import { getMissionPhase } from '../../data/events';
import { SPEED_OF_LIGHT_KMS } from '../../data/constants';

export const positionRouter = Router();

positionRouter.get('/', async (req, res) => {
  try {
    const tParam = (req.query.t as string) || 'now';
    const epoch = tParam === 'now' ? Date.now() : new Date(tParam).getTime();

    if (isNaN(epoch)) {
      return res.status(400).json({ error: 'Invalid time parameter' });
    }

    const trajectory = await getTrajectory();
    const pos = hermiteInterpolate(trajectory, epoch);

    if (!pos) {
      return res.status(404).json({
        error: 'No trajectory data for requested time',
        available_range: {
          start: new Date(trajectory[0].epoch).toISOString(),
          end: new Date(trajectory[trajectory.length - 1].epoch).toISOString(),
        },
      });
    }

    const distEarth = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);

    const moon = GeoMoon(new Date(epoch));
    const moonKm = { x: moon.x * KM_PER_AU, y: moon.y * KM_PER_AU, z: moon.z * KM_PER_AU };
    const distMoon = Math.sqrt(
      (pos.x - moonKm.x) ** 2 + (pos.y - moonKm.y) ** 2 + (pos.z - moonKm.z) ** 2,
    );

    const velocity = Math.sqrt(pos.vx ** 2 + pos.vy ** 2 + pos.vz ** 2);

    res.json({
      x: pos.x,
      y: pos.y,
      z: pos.z,
      vx: pos.vx,
      vy: pos.vy,
      vz: pos.vz,
      distance_earth_km: Math.round(distEarth * 100) / 100,
      distance_moon_km: Math.round(distMoon * 100) / 100,
      velocity_kms: Math.round(velocity * 1000) / 1000,
      light_time_seconds: Math.round((distEarth / SPEED_OF_LIGHT_KMS) * 1000) / 1000,
      timestamp_utc: new Date(epoch).toISOString(),
      mission_phase: getMissionPhase(epoch),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});
