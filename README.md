# Artemisee

Interactive 3D visualization of NASA's Artemis program missions, built with React Three Fiber and real JPL Horizons ephemeris data. Track Artemis II live or replay Artemis I.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

![Artemisee Screenshot](PLANS/artemisee-screen.png)

## Features

### 3D Visualization
- **Real trajectory data** from JPL Horizons API (Artemis II: -1024, Artemis I: -1023)
- **3D Earth, Moon, and Orion spacecraft** with correct positions
- **ISS marker** — live International Space Station position in the 3D scene
- **Hermite spline interpolation** for smooth 60fps animation between 30-minute data points
- **Moon position** computed client-side via `astronomy-engine`
- **Earth rotation** synced to Greenwich Apparent Sidereal Time
- **Celestial direction markers**, moon orbit, ecliptic ring, J2000 axis guides

### Mission Control
- **Mission selector** — switch between Artemis II (live) and Artemis I (replay)
- **Playback controls** — play/pause, speed (1x to 1h/s), jump to now or restart replay
- **Camera presets** — Overview, Earth, Moon, Orion with smooth transitions
- **DSN status** — live Deep Space Network antenna tracking (polls every 10s)
- **Mission stats** — distance from Earth/Moon, speed, light-time delay, MET

### Live Data Feeds
- **Space news** — aggregated from SpaceNews, NASASpaceflight, Space.com via Spaceflight News API
- **Space weather** — solar wind speed/density, magnetic field, Kp index from NOAA SWPC
- **DONKI alerts** — CMEs, solar flares, geomagnetic storms from NASA
- **APOD** — NASA Astronomy Picture of the Day
- **Upcoming launches** — from Launch Library 2
- **EPIC Earth imagery** — full-disc Earth photos from DSCOVR L1

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D rendering | React Three Fiber + drei |
| Celestial math | astronomy-engine |
| Data fetching | @tanstack/react-query |
| State | zustand |
| API proxy | Express |
| Build | Vite + TypeScript |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/w00jay/artemisee.git
cd artemisee
npm install
```

### 2. Configure the API proxy

Copy the example environment file and set your API server address:

```bash
cp .env.example .env
# Edit .env to set VITE_API_URL (defaults to http://localhost:4001)
```

### 3. Start the API server

The API server proxies requests to JPL Horizons (which blocks browser CORS) and the DSN Now XML feed.

```bash
# Run on the same machine:
npm run server

# Or with auto-reload:
npm run server:watch
```

If running the API server on a different machine, update `VITE_API_URL` in `.env` and ensure the port is accessible.

### 4. Start the frontend

```bash
npm run dev
```

Open http://localhost:5173

### 5. Run tests

```bash
npm test
```

## Architecture

```
Browser (Vite :5173)              API Server (:4001)
┌──────────────────┐              ┌──────────────────────────┐
│  React Three     │   /api/*     │  Express                 │
│  Fiber scene     │ ──────────── │  ├─ /horizons            │ ──► JPL Horizons
│  + UI overlay    │  (proxied)   │  ├─ /dsn                 │ ──► DSN Now XML
│  + zustand store │              │  ├─ /v1/news             │ ──► Spaceflight News API
│  + live feeds    │              │  ├─ /v1/weather          │ ──► NOAA SWPC
│                  │              │  ├─ /v1/apod             │ ──► NASA APOD
│                  │              │  ├─ /v1/launches         │ ──► Launch Library 2
│                  │              │  ├─ /v1/epic             │ ──► NASA EPIC (DSCOVR)
│                  │              │  ├─ /v1/donki            │ ──► NASA DONKI
│                  │              │  └─ /v1/iss              │ ──► ISS position
└──────────────────┘              └──────────────────────────┘
```

- **Frontend** fetches trajectory data once, caches it, and interpolates at 60fps
- **astronomy-engine** computes Moon position and Earth rotation client-side (no API needed)
- **API server** caches all external API responses with appropriate TTLs (5–60 min)
- **Mission replay** — completed missions use infinite cache and no refetching

## Data Sources

| Source | API | Data |
|--------|-----|------|
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | REST | Spacecraft ephemeris |
| [DSN Now](https://eyes.nasa.gov/apps/dsn-now/) | XML | Antenna tracking status |
| [astronomy-engine](https://github.com/cosinekitty/astronomy) | Local | Moon/planet positions, sidereal time |
| [Spaceflight News API](https://api.spaceflightnewsapi.net/) | REST | Aggregated space news |
| [NOAA SWPC](https://services.swpc.noaa.gov/) | JSON | Solar wind, Kp index |
| [NASA DONKI](https://api.nasa.gov/) | REST | CMEs, flares, storms |
| [NASA APOD](https://api.nasa.gov/) | REST | Astronomy Picture of the Day |
| [NASA EPIC](https://api.nasa.gov/) | REST | Full-disc Earth imagery |
| [Launch Library 2](https://ll.thespacedevs.com/) | REST | Upcoming launches |
| [Where The ISS At](https://wheretheiss.at/) | REST | ISS position |
| [NASA AROW](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/) | — | Official real-time tracker |

## Coordinate System

The scene uses J2000 Earth-Centered Inertial (ECI) coordinates transformed to Three.js (Y-up):

| ECI Axis | Three.js | Direction |
|----------|----------|-----------|
| X | X | Vernal equinox |
| Y | -Z | 90° east in equatorial plane |
| Z | Y | North celestial pole |

Positions are scaled so 1 unit = 1 Earth radius (6,371 km). The Moon orbits at ~60 units.

## License

MIT — see [LICENSE](LICENSE).

Trajectory data from NASA/JPL is public domain. This project is not affiliated with, endorsed by, or sponsored by NASA or JPL.

### Image Credits

- **Earth texture**: [Blue Marble Next Generation](https://visibleearth.nasa.gov/images/73909) — NASA Visible Earth
- **Moon texture**: [LROC Color Map](https://svs.gsfc.nasa.gov/4720) — NASA Scientific Visualization Studio / Lunar Reconnaissance Orbiter
- **Orion spacecraft sprite**: [NASA/JSC render](https://images.nasa.gov/details/jsc2022e046364) — public domain
