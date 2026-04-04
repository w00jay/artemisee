import type { TrajectoryPoint } from './types';
import { parseHorizonsVectors } from './horizons-parser';
import { HORIZONS_DEFAULTS, MISSION_START, MISSION_END } from './constants';

let cachedPoints: TrajectoryPoint[] = [];
let lastFetchTime = 0;
let fetchPromise: Promise<void> | null = null;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

function buildHorizonsUrl(start: Date, end: Date): string {
  const params = new URLSearchParams({
    ...HORIZONS_DEFAULTS,
    START_TIME: `'${start.toISOString().slice(0, 19)}'`,
    STOP_TIME: `'${end.toISOString().slice(0, 19)}'`,
  });
  return `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
}

async function fetchFromHorizons(): Promise<TrajectoryPoint[]> {
  const url = buildHorizonsUrl(MISSION_START, MISSION_END);
  console.log('[trajectory-cache] Fetching from JPL Horizons...');
  const res = await fetch(url);
  const json = await res.json();

  if (json.error) {
    throw new Error(`Horizons API error: ${json.error}`);
  }

  const points = parseHorizonsVectors(json);
  console.log(`[trajectory-cache] Parsed ${points.length} trajectory points`);
  return points;
}

export async function getTrajectory(): Promise<TrajectoryPoint[]> {
  const now = Date.now();

  if (cachedPoints.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedPoints;
  }

  // Deduplicate concurrent fetches
  if (!fetchPromise) {
    fetchPromise = fetchFromHorizons()
      .then((points) => {
        cachedPoints = points;
        lastFetchTime = Date.now();
      })
      .catch((err) => {
        console.error('[trajectory-cache] Fetch failed:', err);
        // Keep stale cache if available
        if (cachedPoints.length === 0) throw err;
      })
      .finally(() => {
        fetchPromise = null;
      });
  }

  await fetchPromise;
  return cachedPoints;
}

export function getCacheInfo(): { points: number; age_seconds: number; last_fetch_utc: string } {
  return {
    points: cachedPoints.length,
    age_seconds: lastFetchTime ? Math.floor((Date.now() - lastFetchTime) / 1000) : -1,
    last_fetch_utc: lastFetchTime ? new Date(lastFetchTime).toISOString() : 'never',
  };
}
