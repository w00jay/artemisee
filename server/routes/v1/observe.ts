import { Router } from 'express';
import { GeoMoon, KM_PER_AU, Body, GeoVector, Horizon, MakeTime, SiderealTime } from 'astronomy-engine';
import { getTrajectory } from '../../data/trajectory-cache';
import { hermiteInterpolate } from '../../data/interpolate';

export const observeRouter = Router();

observeRouter.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const tParam = (req.query.t as string) || 'now';

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'lat and lon are required numeric parameters' });
    }

    const epoch = tParam === 'now' ? Date.now() : new Date(tParam).getTime();
    if (isNaN(epoch)) {
      return res.status(400).json({ error: 'Invalid time parameter' });
    }

    const date = new Date(epoch);
    const trajectory = await getTrajectory();
    const pos = hermiteInterpolate(trajectory, epoch);

    if (!pos) {
      return res.status(404).json({ error: 'No trajectory data for requested time' });
    }

    // Compute RA/Dec from geocentric position
    const r = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    const decRad = Math.asin(pos.z / r);
    const raRad = Math.atan2(pos.y, pos.x);

    const raDeg = ((raRad * 180 / Math.PI) + 360) % 360;
    const decDeg = decRad * 180 / Math.PI;

    // Convert RA/Dec to Az/Alt for observer
    const gast = SiderealTime(date);
    const lha = (gast * 15 + lon - raDeg + 360) % 360; // Local Hour Angle in degrees
    const lhaRad = lha * Math.PI / 180;
    const latRad = lat * Math.PI / 180;

    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(lhaRad);
    const altDeg = Math.asin(sinAlt) * 180 / Math.PI;

    const cosAz = (Math.sin(decRad) - sinAlt * Math.sin(latRad)) / (Math.cos(Math.asin(sinAlt)) * Math.cos(latRad));
    let azDeg = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
    if (Math.sin(lhaRad) > 0) azDeg = 360 - azDeg;

    // Solar elongation (angle between Sun and spacecraft as seen from Earth)
    const sun = GeoVector(Body.Sun, date, false);
    const sunX = sun.x * KM_PER_AU, sunY = sun.y * KM_PER_AU, sunZ = sun.z * KM_PER_AU;
    const dotProd = (pos.x * sunX + pos.y * sunY + pos.z * sunZ) /
      (r * Math.sqrt(sunX ** 2 + sunY ** 2 + sunZ ** 2));
    const elongDeg = Math.acos(Math.max(-1, Math.min(1, dotProd))) * 180 / Math.PI;

    // Determine sky brightness (simplified)
    const sunAltitude = getSunAltitude(date, lat, lon);
    let skyBrightness: string;
    if (sunAltitude > 0) skyBrightness = 'daylight';
    else if (sunAltitude > -6) skyBrightness = 'civil_twilight';
    else if (sunAltitude > -12) skyBrightness = 'nautical_twilight';
    else if (sunAltitude > -18) skyBrightness = 'astronomical_twilight';
    else skyBrightness = 'dark';

    const visible = altDeg > 5 && skyBrightness !== 'daylight' && skyBrightness !== 'civil_twilight';

    // Format RA as HH:MM:SS
    const raH = raDeg / 15;
    const raHH = Math.floor(raH);
    const raMM = Math.floor((raH - raHH) * 60);
    const raSS = ((raH - raHH) * 60 - raMM) * 60;
    const raStr = `${raHH}h ${String(raMM).padStart(2, '0')}m ${raSS.toFixed(1)}s`;

    // Format Dec as DD:MM:SS
    const decSign = decDeg >= 0 ? '+' : '-';
    const absDec = Math.abs(decDeg);
    const decDD = Math.floor(absDec);
    const decMM = Math.floor((absDec - decDD) * 60);
    const decSS = ((absDec - decDD) * 60 - decMM) * 60;
    const decStr = `${decSign}${decDD}° ${String(decMM).padStart(2, '0')}' ${decSS.toFixed(1)}"`;

    // Build recommendation
    let recommendation: string;
    if (!visible) {
      if (skyBrightness === 'daylight' || skyBrightness === 'civil_twilight') {
        recommendation = 'Not visible — sky is too bright. Wait for darkness.';
      } else if (altDeg <= 5) {
        recommendation = `Not visible — below horizon (altitude ${altDeg.toFixed(1)}°).`;
      } else {
        recommendation = 'Not visible from this location at this time.';
      }
    } else {
      const compassDir = getCompassDirection(azDeg);
      recommendation = `Visible — look ${compassDir} at about ${Math.round(altDeg)}° above the horizon.`;
      if (r > 50000) recommendation += ' You will need binoculars or a telescope.';
    }

    res.json({
      visible,
      azimuth_deg: Math.round(azDeg * 10) / 10,
      altitude_deg: Math.round(altDeg * 10) / 10,
      ra: raStr,
      dec: decStr,
      solar_elongation_deg: Math.round(elongDeg * 10) / 10,
      sky_brightness: skyBrightness,
      recommendation,
      timestamp_utc: new Date(epoch).toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

function getSunAltitude(date: Date, lat: number, lon: number): number {
  const sun = GeoVector(Body.Sun, date, false);
  const sunR = Math.sqrt(sun.x ** 2 + sun.y ** 2 + sun.z ** 2);
  const sunDec = Math.asin(sun.z / sunR);
  const sunRA = Math.atan2(sun.y, sun.x);

  const gast = SiderealTime(date);
  const sunLHA = ((gast * 15 + lon - sunRA * 180 / Math.PI) % 360) * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  const sinAlt = Math.sin(sunDec) * Math.sin(latRad) + Math.cos(sunDec) * Math.cos(latRad) * Math.cos(sunLHA);
  return Math.asin(sinAlt) * 180 / Math.PI;
}

function getCompassDirection(azDeg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(azDeg / 22.5) % 16;
  return dirs[idx];
}
