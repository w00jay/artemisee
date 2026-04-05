import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { getTrajectory } from '../data/trajectory-cache';
import { hermiteInterpolate } from '../data/interpolate';
import { getEvents, getMissionPhase } from '../data/events';
import { geoMoon, geoVector, siderealTime, getKmPerAU } from '../data/astronomy';
import { SPEED_OF_LIGHT_KMS, MISSION_START, MISSION_END } from '../data/constants';

const server = new McpServer({
  name: 'artemisee',
  version: '0.2.0',
});

// --- Tool 1: get_spacecraft_position ---

server.tool(
  'get_spacecraft_position',
  'Get the current or historical position of the Artemis II Orion spacecraft. Returns position in km from Earth center, distances to Earth and Moon, velocity, light-time delay, and current mission phase.',
  {
    time: z.string().optional().describe('ISO 8601 timestamp or "now". Default "now".'),
  },
  async ({ time }) => {
    const epoch = !time || time === 'now' ? Date.now() : new Date(time).getTime();
    if (isNaN(epoch)) return error('Invalid time parameter');

    const trajectory = await getTrajectory();
    const pos = hermiteInterpolate(trajectory, epoch);
    if (!pos) return error('No trajectory data for requested time');

    const distEarth = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);

    const KM_PER_AU = await getKmPerAU();
    const moon = await geoMoon(new Date(epoch));
    const moonKm = { x: moon.x * KM_PER_AU, y: moon.y * KM_PER_AU, z: moon.z * KM_PER_AU };
    const distMoon = Math.sqrt(
      (pos.x - moonKm.x) ** 2 + (pos.y - moonKm.y) ** 2 + (pos.z - moonKm.z) ** 2,
    );

    const velocity = Math.sqrt(pos.vx ** 2 + pos.vy ** 2 + pos.vz ** 2);
    const lightTime = distEarth / SPEED_OF_LIGHT_KMS;
    const phase = getMissionPhase(epoch);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          position_km: { x: r(pos.x), y: r(pos.y), z: r(pos.z) },
          velocity_kms: { vx: r(pos.vx, 4), vy: r(pos.vy, 4), vz: r(pos.vz, 4) },
          distance_earth_km: r(distEarth),
          distance_moon_km: r(distMoon),
          speed_kms: r(velocity, 3),
          speed_kmh: r(velocity * 3600),
          light_time_seconds: r(lightTime, 3),
          mission_phase: phase,
          timestamp_utc: new Date(epoch).toISOString(),
        }, null, 2),
      }],
    };
  },
);

// --- Tool 2: get_mission_events ---

server.tool(
  'get_mission_events',
  'Get upcoming or past Artemis II mission events. Returns event name, Mission Elapsed Time, UTC timestamp, countdown, and status.',
  {
    filter: z.enum(['upcoming', 'past', 'all', 'burns', 'milestones']).optional()
      .describe('Which events to return. Default "upcoming".'),
    limit: z.number().int().optional().describe('Max events to return. Default 5.'),
  },
  async ({ filter, limit }) => {
    const events = getEvents(filter ?? 'upcoming', Date.now(), limit ?? 5);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          events: events.map((e) => ({
            name: e.name,
            met: e.met,
            utc: e.utc,
            category: e.category,
            countdown_seconds: Math.round(e.countdown_seconds),
            status: e.status,
          })),
          reference_utc: new Date().toISOString(),
        }, null, 2),
      }],
    };
  },
);

// --- Tool 3: can_i_see_artemis ---

server.tool(
  'can_i_see_artemis',
  'Determine if the Artemis II spacecraft is visible from a given location right now or at a specified time. Returns visibility, azimuth/altitude, RA/Dec, sky brightness, and a human-readable viewing recommendation.',
  {
    latitude: z.number().describe('Observer latitude in decimal degrees.'),
    longitude: z.number().describe('Observer longitude in decimal degrees.'),
    time: z.string().optional().describe('ISO 8601 timestamp or "now". Default "now".'),
  },
  async ({ latitude, longitude, time }) => {
    const epoch = !time || time === 'now' ? Date.now() : new Date(time).getTime();
    if (isNaN(epoch)) return error('Invalid time parameter');

    const date = new Date(epoch);
    const trajectory = await getTrajectory();
    const pos = hermiteInterpolate(trajectory, epoch);
    if (!pos) return error('No trajectory data for requested time');

    const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    const decRad = Math.asin(pos.z / dist);
    const raRad = Math.atan2(pos.y, pos.x);
    const raDeg = ((raRad * 180 / Math.PI) + 360) % 360;

    const gast = await siderealTime(date);
    const lha = (gast * 15 + longitude - raDeg + 360) % 360;
    const lhaRad = lha * Math.PI / 180;
    const latRad = latitude * Math.PI / 180;

    const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(lhaRad);
    const altDeg = Math.asin(sinAlt) * 180 / Math.PI;

    const cosAz = (Math.sin(decRad) - sinAlt * Math.sin(latRad)) / (Math.cos(Math.asin(sinAlt)) * Math.cos(latRad));
    let azDeg = Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180 / Math.PI;
    if (Math.sin(lhaRad) > 0) azDeg = 360 - azDeg;

    // Sun altitude for sky brightness
    const KM_PER_AU = await getKmPerAU();
    const sun = await geoVector('Sun', date);
    const sunR = Math.sqrt(sun.x ** 2 + sun.y ** 2 + sun.z ** 2);
    const sunDec = Math.asin(sun.z / sunR);
    const sunRA = Math.atan2(sun.y, sun.x);
    const sunLHA = ((gast * 15 + longitude - sunRA * 180 / Math.PI) % 360) * Math.PI / 180;
    const sunSinAlt = Math.sin(sunDec) * Math.sin(latRad) + Math.cos(sunDec) * Math.cos(latRad) * Math.cos(sunLHA);
    const sunAlt = Math.asin(sunSinAlt) * 180 / Math.PI;

    let skyBrightness: string;
    if (sunAlt > 0) skyBrightness = 'daylight';
    else if (sunAlt > -6) skyBrightness = 'civil_twilight';
    else if (sunAlt > -12) skyBrightness = 'nautical_twilight';
    else if (sunAlt > -18) skyBrightness = 'astronomical_twilight';
    else skyBrightness = 'dark';

    const visible = altDeg > 5 && skyBrightness !== 'daylight' && skyBrightness !== 'civil_twilight';

    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const compassDir = dirs[Math.round(azDeg / 22.5) % 16];

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
      recommendation = `Visible — look ${compassDir} at about ${Math.round(altDeg)}° above the horizon.`;
      if (dist > 50000) recommendation += ' You will need binoculars or a telescope.';
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          visible,
          azimuth_deg: r(azDeg, 1),
          altitude_deg: r(altDeg, 1),
          sky_brightness: skyBrightness,
          recommendation,
          distance_km: r(dist),
          timestamp_utc: new Date(epoch).toISOString(),
        }, null, 2),
      }],
    };
  },
);

// --- Tool 4: get_trajectory_segment ---

server.tool(
  'get_trajectory_segment',
  'Get a trajectory segment for visualization or analysis. Returns an array of position/velocity points at the specified resolution.',
  {
    start: z.string().optional().describe('Start time (ISO 8601). Default mission start.'),
    stop: z.string().optional().describe('End time (ISO 8601). Default mission end.'),
    step_minutes: z.number().int().optional().describe('Time step in minutes. Default 30.'),
  },
  async ({ start, stop, step_minutes }) => {
    const trajectory = await getTrajectory();

    const startEpoch = start ? new Date(start).getTime() : MISSION_START.getTime();
    const stopEpoch = stop ? new Date(stop).getTime() : MISSION_END.getTime();
    const stepMs = (step_minutes ?? 30) * 60 * 1000;

    let points = trajectory.filter((p) => p.epoch >= startEpoch && p.epoch <= stopEpoch);

    // Downsample
    if (stepMs > 0) {
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

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          count: points.length,
          points: points.map((p) => ({
            t: new Date(p.epoch).toISOString(),
            x: p.x, y: p.y, z: p.z,
            vx: p.vx, vy: p.vy, vz: p.vz,
          })),
        }, null, 2),
      }],
    };
  },
);

// --- Tool 5: get_dsn_status ---

server.tool(
  'get_dsn_status',
  'Get current Deep Space Network communication status with Artemis II. Shows which antennas are in contact with Orion, their station, and spacecraft range.',
  {},
  async () => {
    try {
      const response = await fetch('https://eyes.nasa.gov/dsn/data/dsn.xml');
      const xml = await response.text();
      const contacts = parseDsnXml(xml);

      const artemis = contacts.filter(
        (c) => c.target === 'EM2' || c.target.includes('ARTEMIS'),
      );

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            artemis_contacts: artemis,
            all_active_contacts: contacts.length,
            timestamp_utc: new Date().toISOString(),
          }, null, 2),
        }],
      };
    } catch (err) {
      return error(`Failed to fetch DSN data: ${err instanceof Error ? err.message : err}`);
    }
  },
);

// --- Helpers ---

function r(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function error(message: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: message }) }], isError: true };
}

interface DsnContact {
  antenna: string;
  station: string;
  target: string;
  range_km: number;
}

function parseDsnXml(xml: string): DsnContact[] {
  const contacts: DsnContact[] = [];

  const stationPositions: { pos: number; friendly: string }[] = [];
  const stationRegex = /<station\s+name="[^"]*"[^>]*friendlyName="([^"]*)"[^>]*\/>/g;
  let match;
  while ((match = stationRegex.exec(xml)) !== null) {
    stationPositions.push({ pos: match.index, friendly: match[1] });
  }

  const dishRegex = /<dish\s+name="([^"]*)"[^>]*>([\s\S]*?)<\/dish>/g;
  while ((match = dishRegex.exec(xml)) !== null) {
    const dishPos = match.index;
    const dishName = match[1];
    const dishBody = match[2];

    let station = '';
    for (let i = stationPositions.length - 1; i >= 0; i--) {
      if (stationPositions[i].pos < dishPos) {
        station = stationPositions[i].friendly;
        break;
      }
    }

    const targetRegex = /<target\s+name="([^"]*)"[^>]*downlegRange="([^"]*)"[^>]*\/?>/g;
    let tgt;
    while ((tgt = targetRegex.exec(dishBody)) !== null) {
      if (tgt[1] === 'DSN' || tgt[1] === 'DSS') continue;
      contacts.push({ antenna: dishName, station, target: tgt[1], range_km: parseFloat(tgt[2]) });
    }
  }

  return contacts;
}

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Artemisee MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
