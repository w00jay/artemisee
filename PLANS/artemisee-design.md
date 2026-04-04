# Building an Artemis II tracker with the JPL Horizons API

The JPL Horizons REST API at `ssd.jpl.nasa.gov/api/horizons.api` provides free, unauthenticated access to Artemis II ephemeris data under spacecraft ID **-1024**, returning position and velocity vectors in JSON format — but **browser CORS is blocked**, making a backend proxy mandatory for any web application. Combined with NASA's real-time AROW telemetry feed, DSN Now communications data, and client-side libraries like React Three Fiber and `astronomy-engine`, a React-based tracker can deliver near-real-time 3D visualization of the ~10-day lunar flyby mission that launched April 1, 2026. This report covers every parameter, endpoint, data source, and architectural decision needed for implementation.

## The Horizons REST API accepts one GET request with dozens of tunable parameters

The primary endpoint is a simple GET request:

```
GET https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='-1024'&...
```

**Version 1.3** per the docs (June 2025), though the live API currently self-reports as version 1.2, requires no API key or authentication. The `COMMAND` parameter takes the target body ID — **`'-1024'`** for Artemis II (officially "Artemis II (spacecraft) (Integrity)") and `'-1023'` for Artemis I. All spacecraft use negative integer IDs. To discover IDs, query the lookup endpoint: `https://ssd.jpl.nasa.gov/api/horizons_lookup.api?sstr=Artemis&group=sct`.

The three ephemeris types most relevant to a visual tracker are:

- **`EPHEM_TYPE='VECTORS'`** — Returns Cartesian state vectors {X, Y, Z, VX, VY, VZ} in km and km/s. This is the primary data source for 3D visualization. The `VEC_TABLE` parameter controls output granularity: `'2'` for state vectors only, `'3'` for state vectors plus light-time, range, and range-rate.
- **`EPHEM_TYPE='OBSERVER'`** — Returns observational quantities like RA/DEC, azimuth/elevation, range, illumination, and phase angles. The `QUANTITIES` parameter accepts comma-separated codes from **1 to 48** (or `'A'` for all). The most useful codes for a tracker: `1` (astrometric RA/DEC), `4` (apparent Az/El), `10` (illuminated fraction), `20` (observer range and range-rate), `21` (light-time), `23` (solar elongation), and `24` (phase angle).
- **`EPHEM_TYPE='ELEMENTS'`** — Returns osculating orbital elements, useful for computing orbital shape parameters for visualization.

The coordinate center is specified via `CENTER`: **`'500@399'`** for geocentric (Earth center), **`'500@301'`** for selenocentric (Moon center), **`'500@10'`** for heliocentric, and `'@0'` for the solar system barycenter. The `500` prefix means body center; replace with an IAU observatory code for topocentric results (e.g., `'675'` for Palomar). Custom surface coordinates use `CENTER='coord'` with `SITE_COORD='lon,lat,alt'`.

Time parameters are flexible. `START_TIME` and `STOP_TIME` accept ISO dates (`'2026-04-02'`), named months (`'2026-Apr-02 22:35:12'`), or Julian dates (`'JD 2460767.5'`). **`STEP_SIZE`** supports `'1d'` (days), `'3h'` (hours), `'10m'` (minutes), calendar units (`'1 mo'`), or a unitless integer that divides the time span into N equal parts — the only way to achieve sub-minute resolution (minimum **0.5 seconds**). Alternatively, `TLIST` accepts up to **10,000 discrete timestamps** as Julian dates, MJD, or calendar strings, bypassing START/STOP/STEP entirely.

The reference frame defaults to **ICRF** (aligned with J2000 to <0.1 arcsec) and can be set to `B1950` via `REF_SYSTEM`. For vectors and elements, `REF_PLANE` offers `'ECLIPTIC'` (default), `'FRAME'` (Earth equatorial/J2000), or `'BODY EQUATOR'` (equator of date). Output units are controlled by `OUT_UNITS`: `'KM-S'` (default), `'AU-D'`, or `'KM-D'`.

A working API call for Artemis II trajectory data:

```
https://ssd.jpl.nasa.gov/api/horizons.api?format=json
  &COMMAND='-1024'
  &OBJ_DATA='YES'
  &MAKE_EPHEM='YES'
  &EPHEM_TYPE='VECTORS'
  &CENTER='500@399'
  &REF_PLANE='FRAME'
  &START_TIME='2026-04-02'
  &STOP_TIME='2026-04-11'
  &STEP_SIZE='30m'
  &CSV_FORMAT='YES'
```

The JSON response wraps all output in a `result` string field, with ephemeris data delimited between `$$SOE` and `$$EOE` markers. Errors appear in an `error` field. Setting `CSV_FORMAT='YES'` makes parsing significantly easier. Note that Artemis II ephemeris data begins approximately **3.5 hours after launch** (after ICPS separation), so queries for dates before April 2, 2026 will return errors.

## Five data sources power a comprehensive Artemis II tracker

The Horizons API provides predicted ephemeris data, but a production tracker benefits from layering multiple NASA data sources:

**NASA AROW (Artemis Real-time Orbit Website)** at `nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/` is the official real-time tracker, displaying sensor-derived telemetry from Orion streamed to Mission Control at JSC. It shows distance from Earth, distance from Moon, elapsed mission time, and trajectory path. Critically, NASA publishes **downloadable ephemeris data** on the AROW page during the mission in CCSDS Orbital Ephemeris Message (OEM) format, which can be used with third-party spaceflight software, telescopes, or custom tracking applications.

**DSN Now** at `eyes.nasa.gov/apps/dsn-now/` provides **5-second update** data showing which Deep Space Network antennas are communicating with Orion, including uplink/downlink frequencies, signal strength, data rates, and spacecraft distance. The underlying XML feed at `eyes.nasa.gov/dsn/data/dsn.xml` is undocumented but publicly accessible and has been utilized by community projects (`pydsn` by russss, `DSN-Now-Scraper` by EzraBrooks — note: archived since 2022). It provides real-time communication status during the mission.

**NASA Eyes on the Solar System** at `eyes.nasa.gov/apps/solar-system/` offers embeddable 3D visualization powered by SPICE kernels. Appending `?embed=true` produces a clean iframe-ready view that tracks Artemis missions with scientifically accurate positioning and time scrubbing from 1950 to 2050.

**WebGeocalc** at `wgc2.jpl.nasa.gov:8443/webgeocalc/api` is a REST API for SPICE-based geometry calculations (state vectors, angular separations, coordinate transforms) — valuable if Artemis II kernel sets become available on the NAIF server during the mission. The Python package `webgeocalc` wraps this API.

**Space-Track.org** provides TLE data only for the brief Earth-orbit phase before Trans-Lunar Injection. Once Orion enters a cislunar trajectory, **SGP4/TLE propagation becomes invalid** and Horizons ephemerides are the only reliable source.

## React Three Fiber delivers the best balance of control and React integration

For a custom React-based 3D tracker, **React Three Fiber (`@react-three/fiber`)** with **`@react-three/drei`** provides full declarative JSX control over the Earth-Moon-spacecraft scene, smaller bundle size than CesiumJS, and seamless React lifecycle integration. The alternative — **CesiumJS with Resium** — is preferable when geospatial accuracy is paramount (ground tracks, pass predictions, WGS84 terrain), but its ~30MB bundle and complex configuration make it heavier for a focused mission tracker.

The critical coordinate transformation from JPL Horizons output (J2000 ECI, Z-up) to Three.js (Y-up) requires an axis swap:

```javascript
// J2000 ECI → Three.js (right-handed Y-up)
function j2000ToThreeJS(x, y, z, scale = 1/6371) {
  return new THREE.Vector3(x * scale, z * scale, -y * scale);
}
```

The **`astronomy-engine`** npm package is the strongest client-side library for this project. It calculates Moon and Earth positions directly in-browser (VSOP87-based, verified against NOVAS/JPL Horizons to ±1 arcminute) without API calls, handles coordinate system conversions between J2000 equatorial, ecliptic, horizontal, and galactic frames, and has zero dependencies. This eliminates the need to query Horizons for Moon position data.

For Earth-Moon scale visualization, the ~60:1 ratio between lunar distance (**384,400 km**) and Earth radius (**6,371 km**) creates rendering challenges. The proven approach from the existing `tchung1970/artemis2` Three.js project uses Bezier-curve trajectory interpolation with camera presets for Solar System, Earth, Moon, and Spacecraft views, letting users jump between scales. NASA Blue Marble textures (2K-4K for web, up to 21,600×10,800 available) and the NASA CGI Moon Kit (16,384×8,192) provide free, high-quality globe textures.

The recommended minimal stack:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| 3D rendering | `@react-three/fiber` + `@react-three/drei` | Earth, Moon, trajectory, spacecraft |
| Coordinates | `astronomy-engine` | Moon/Earth positions, frame transforms |
| Data fetching | `@tanstack/react-query` | Cached polling with dynamic stale times |
| State | `zustand` | Simulation time, playback speed, camera target |
| 2D panels | `recharts` | Distance graphs, timeline, mission events |
| Build | Vite + TypeScript | Fast HMR, tree-shaking |

## A backend proxy is non-negotiable, and caching makes it efficient

The JPL SSD API documentation explicitly states: **"You may not embed these APIs in your website (per NASA CORS policy)."** No `Access-Control-Allow-Origin` headers are set, so direct browser `fetch()` calls fail. Additionally, JPL expects fair-use behavior — while no strict one-request-at-a-time policy is documented for the REST API, concurrent request flooding should be avoided.

The lightest production solution uses **Vercel or Netlify serverless functions** as a proxy:

```typescript
// api/horizons.ts (Vercel serverless function)
export default async function handler(req, res) {
  const params = new URLSearchParams(req.query);
  const response = await fetch(
    `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`
  );
  const data = await response.json();
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.json(data);
}
```

For development and heavier production use, an Express server with `node-cache` and `rate-limiter-flexible` adds server-side caching and rate limiting. The key insight is that **ephemeris data is deterministic for a given solution** — identical queries return the same data until the navigation team uploads updated tracking solutions (OD updates). During the active mission, OD updates happen frequently (especially around maneuvers), so cache TTLs should be shorter: **15-30 minutes during active mission phases**, extending to **1-6 hours for quiescent cruise segments** or post-mission. Pre-mission predicted trajectories can be cached for 24+ hours.

The optimal data fetching strategy is **batch pre-fetch with client-side interpolation**:

1. Fetch the full mission trajectory (April 2-11) at 30-minute intervals in a single API call (~480 data points)
2. Cache this on the server for 1-6 hours
3. Use `THREE.CubicInterpolant` or Hermite spline interpolation on the client to smoothly animate between discrete points at 60fps
4. Periodically refetch to pick up trajectory updates from navigation maneuvers
5. Use `@tanstack/react-query` with a dynamic `refetchInterval` — 15-30 minutes during active mission, 1 hour during cruise, longer post-mission

For "current position" display, calculate the interpolated position at `Date.now()` from the cached trajectory data rather than making a new API call for each refresh. The `useFrame` hook in React Three Fiber runs every animation frame, making this trivial:

```typescript
useFrame(() => {
  const now = Date.now();
  const pos = interpolateTrajectory(trajectoryData, now);
  spacecraftRef.current.position.copy(j2000ToThreeJS(pos.x, pos.y, pos.z));
});
```

## Parsing Horizons responses requires handling a text-in-JSON format

The Horizons API returns all ephemeris data as a raw text string inside a JSON wrapper, not as structured JSON arrays. Parsing requires extracting the text between `$$SOE` and `$$EOE` markers, then splitting by line. With `CSV_FORMAT='YES'`, each line becomes comma-delimited, making parsing straightforward:

```typescript
function parseHorizonsVectors(json: { result: string }) {
  const lines = json.result
    .split('$$SOE')[1]
    .split('$$EOE')[0]
    .trim()
    .split('\n')
    .filter(line => line.trim());
  
  // With CSV_FORMAT='YES' and VEC_TABLE='2':
  // Each pair of lines: JDTDB, Calendar Date, X, Y, Z then VX, VY, VZ
  return lines.reduce((acc, line, i) => {
    // Parse position and velocity from CSV fields
    const fields = line.split(',').map(f => f.trim());
    // ... extract X, Y, Z, VX, VY, VZ
    return acc;
  }, []);
}
```

For the observer table, quantity codes **20** (range in km and range-rate in km/s) and **21** (one-way light-time in minutes) give the dashboard-friendly "distance from Earth" metric directly. Querying with `CENTER='500@301'` (Moon center) separately provides distance from Moon. Quantity **10** (illuminated fraction) and **24** (phase angle) add visual context.

## Existing open-source projects provide proven reference architectures

A few community projects and established tools serve as implementation references:

**NASA Open MCT** (`nasa/openmct`, 12,800+ stars) is the most mature reference — a production-grade mission operations framework with plugin architecture, telemetry handling, and timeline visualization patterns used at JPL and Ames. While not a 3D tracker itself, its architectural patterns for telemetry ingest and time-domain visualization are directly applicable.

**`cucco-io/artemis-ii-tracker`** and **`tchung1970/artemis2`** are very new community projects (both created April 2, 2026). They are early-stage and may be useful for implementation ideas, but should not be treated as battle-tested references. The `artemis-tracker.netlify.app` site appears to be a working tracker with telemetry data and DSN integration. The `tchung1970/artemis2` repo implements a Three.js-based Artemis II flight simulation with Bezier-curve trajectory interpolation.

For CesiumJS-based approaches, **`Flowm/satvis`** (deployed at `satvis.space`) and **`itsmedmd/satellite-tracker`** (22,000+ objects) demonstrate high-performance orbital visualization with CZML time-dynamic data and `SampledPositionProperty` interpolation.

## Conclusion

The practical path to a production Artemis II tracker combines **Horizons vectors data** (fetched server-side, cached aggressively, interpolated client-side) with **`astronomy-engine`** for Moon/Earth positions and coordinate transforms, all rendered through **React Three Fiber**. The architecture is a thin serverless proxy in front of JPL's API, a zustand-managed simulation clock, and pre-fetched trajectory segments that animate at 60fps through cubic interpolation. Supplement with AROW downloadable ephemeris for ground-truth telemetry, DSN Now XML scraping for live communication status, and an embeddable NASA Eyes iframe for a polished secondary view. The biggest technical gotchas are that Horizons returns text-inside-JSON (not structured data) and CORS blocks all browser-direct access — both solved by server-side proxying, batching, and caching. Cache TTLs should adapt to mission phase (shorter during active maneuvers, longer during cruise). The AROW OEM data provides a complementary ground-truth source that can serve as a fallback if Horizons is temporarily unavailable.