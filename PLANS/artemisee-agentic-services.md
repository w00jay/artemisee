# Artemisee Agentic Services Architecture

**Repo:** https://github.com/w00jay/artemisee
**Purpose:** Extend the Artemis II web tracker into an agentic platform offering MCP, REST API, and RSS services over cached JPL Horizons ephemeris data.

---

## Core Data Layer

The foundation is a server-side proxy that caches JPL Horizons API responses and pre-computes derived quantities. All three service interfaces (MCP, REST, RSS) consume from this shared cache.

### Horizons Proxy

- **Upstream:** `https://ssd.jpl.nasa.gov/api/horizons.api`
- **Target body:** `-1024` (Artemis II / Orion "Integrity")
- **Constraint:** JPL expects fair-use behavior — no documented one-request-at-a-time policy, but avoid flooding
- **Cache strategy:** Ephemeris is deterministic per nav solution. Adaptive TTL: 15-30 min during active mission phases, 1-6 hours during cruise, 24+ hours post-mission.
- **Batch fetch:** Full mission trajectory (Apr 2-11, 2026) at 30-min intervals (~480 points) in a single API call
- **Interpolation:** Server-side Hermite spline interpolation (uses velocity vectors from Horizons for physical accuracy)

### Derived Computations (via `astronomy-engine`)

These run server-side without hitting Horizons again:

- Earth/Moon positions at any timestamp (VSOP87-based, ±1 arcmin vs Horizons)
- Observer-specific azimuth/altitude for any lat/lon
- Solar elongation and sky brightness estimation
- Coordinate transforms: J2000 ECI ↔ ecliptic ↔ horizontal

### Supplementary Data Sources

| Source | URL | Update Rate | Data |
|--------|-----|-------------|------|
| AROW | nasa.gov/artemis-ii tracking page | Near real-time | Telemetry-derived position, distance |
| DSN Now | eyes.nasa.gov/apps/dsn-now/ | 5 seconds | Antenna contacts, signal strength, data rates |
| Space-Track | space-track.org | Periodic | TLEs (Earth-orbit phase only, pre-TLI) |

---

## Service 1: REST API

The frontend's backend — also publicly exposable as a community service that absorbs JPL rate limits.

### Endpoints

```
GET /v1/position
  ?target=-1024        # spacecraft ID (default: -1024)
  &t=now               # ISO timestamp or "now"
  &center=earth        # earth | moon | sun | ssb
  Response: {
    x, y, z,           # km, J2000 ECI
    vx, vy, vz,        # km/s
    distance_earth_km,
    distance_moon_km,
    velocity_kms,
    light_time_seconds,
    timestamp_utc
  }

GET /v1/trajectory
  ?target=-1024
  &start=2026-04-02T02:00:00Z
  &stop=2026-04-11T00:30:00Z
  &step=30m            # 1m, 5m, 30m, 1h, 1d
  Response: {
    points: [{ t, x, y, z, vx, vy, vz, dist_earth, dist_moon }],
    interpolation: "cubic",
    source: "horizons_cached",
    cache_age_seconds: 1234
  }

GET /v1/events
  ?from=now
  &limit=5
  &direction=future    # future | past | both
  Response: {
    events: [{
      name: "Closest approach to Moon",
      met: "5/00:31",
      utc: "2026-04-06T23:06:00Z",
      countdown_seconds: 12345,
      status: "upcoming"  # upcoming | active | completed
    }]
  }

GET /v1/observe
  ?lat=45.52
  &lon=-122.68
  &t=now
  Response: {
    visible: true,
    azimuth_deg: 154.7,
    altitude_deg: 25.3,
    ra: "15h 58m 57.2s",
    dec: "-26° 00' 15.6\"",
    solar_elongation_deg: 130.7,
    sky_brightness: "dark",
    best_window_utc: { start, end },
    recommendation: "Visible now, look SSE about 25° above horizon"
  }

GET /v1/dsn
  Response: {
    contacts: [{
      antenna: "DSS-43",
      station: "Canberra",
      uplink_freq_mhz: 2090.0,
      downlink_freq_mhz: 2270.0,
      signal_strength_dbm: -155.2,
      data_rate_bps: 2048000,
      spacecraft_range_km: 280000
    }]
  }

GET /v1/health
  Response: { status, horizons_cache_age, last_fetch_utc, uptime }
```

### Implementation Notes

- **Framework:** Go (`net/http` or `chi`) or Python (`FastAPI`)
- **Cache:** In-memory (Go `sync.Map` / Python `cachetools`) with Redis fallback for multi-instance
- **Rate limiting:** Token bucket per client IP, generous defaults (100 req/min)
- **CORS:** Open (`*`) — this is public NASA data
- **Deploy:** Fly.io / Railway / Cloud Run (single container, <256MB RAM)

---

## Service 2: MCP Server

The highest-leverage service. Gives any LLM real-time space situational awareness through tool use.

### Tool Definitions

```yaml
tools:
  - name: get_spacecraft_position
    description: >
      Get the current or historical position of the Artemis II Orion spacecraft.
      Returns position in km from Earth center, distances to Earth and Moon,
      velocity, and human-readable description of mission phase.
    parameters:
      time:
        type: string
        description: ISO 8601 timestamp or "now". Default "now".
        required: false
      reference:
        type: string
        enum: [earth, moon, sun]
        description: Coordinate center. Default "earth".
        required: false

  - name: get_mission_events
    description: >
      Get upcoming or past Artemis II mission events. Returns event name,
      Mission Elapsed Time (MET), UTC timestamp, countdown, and status.
    parameters:
      filter:
        type: string
        enum: [upcoming, past, all, burns, milestones]
        description: Which events to return. Default "upcoming".
        required: false
      limit:
        type: integer
        description: Max events to return. Default 5.
        required: false

  - name: can_i_see_artemis
    description: >
      Determine if the Artemis II spacecraft is visible from a given location
      right now or at a specified time. Combines spacecraft position, solar
      elongation, observer geometry, and sky brightness into a clear yes/no
      with viewing instructions (where to look, what equipment needed).
    parameters:
      latitude:
        type: number
        description: Observer latitude in decimal degrees.
        required: true
      longitude:
        type: number
        description: Observer longitude in decimal degrees.
        required: true
      time:
        type: string
        description: ISO 8601 timestamp or "now". Default "now".
        required: false

  - name: get_observation_window
    description: >
      Find the best upcoming observation windows for viewing Artemis II
      from a specific location. Accounts for darkness, altitude above
      horizon, solar elongation, and Moon interference.
    parameters:
      latitude:
        type: number
        required: true
      longitude:
        type: number
        required: true
      hours_ahead:
        type: integer
        description: How many hours ahead to search. Default 48.
        required: false

  - name: get_trajectory_segment
    description: >
      Get a trajectory segment for visualization or analysis. Returns
      an array of position/velocity points at the specified resolution.
    parameters:
      start:
        type: string
        description: Start time (ISO 8601). Default mission start.
        required: false
      stop:
        type: string
        description: End time (ISO 8601). Default mission end.
        required: false
      step_minutes:
        type: integer
        description: Time step in minutes. Default 30.
        required: false

  - name: compare_planned_vs_actual
    description: >
      Compare planned trajectory against latest navigation solution.
      Identifies drift, maneuver residuals, and trajectory corrections.
      Useful for understanding mission performance.
    parameters:
      time:
        type: string
        description: Time to compare at. Default "now".
        required: false

  - name: get_dsn_status
    description: >
      Get current Deep Space Network communication status with Artemis II.
      Shows which antennas are in contact, signal data, and next contact windows.
    parameters: {}
```

### Implementation Options

**Option A: Supabase Edge Function (matches Wooj-brain pattern)**
```
supabase/functions/artemisee-mcp/index.ts
```
- Reuses existing Supabase infrastructure
- Deno runtime, same MCP-over-HTTP pattern as Wooj-brain
- Shares cache with REST API via Supabase KV or Postgres

**Option B: Standalone Go service behind MCP Gateway**
```
cmd/artemisee-mcp/main.go
```
- First real service routed through the MCP Gateway POC
- Proves registry, auth injection, and telemetry patterns
- Natural fit since the REST proxy may already be Go

**Option C: Python FastMCP**
```
artemisee_mcp/server.py
```
- Fastest to prototype with `fastmcp` library
- `astronomy-engine` has a Python port (`astronomy-engine` on PyPI)
- Deploy as Cloud Run or Fly.io container

### Recommended: Option B

This is the play — artemisee-mcp becomes the first service registered in your MCP Gateway. The gateway handles auth, telemetry, and tool registry. The MCP server itself is a thin wrapper over the same cache/computation layer the REST API uses.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Claude /     │────▶│  MCP Gateway  │────▶│  artemisee-mcp   │
│  Any LLM      │     │  (Go proxy)   │     │  (Go service)    │
└──────────────┘     │  - registry   │     │  - tool handlers │
                     │  - auth       │     │  - horizons cache│
                     │  - telemetry  │     │  - astronomy-eng │
                     │  - routing    │     │  - event timeline│
                     └──────────────┘     └──────────────────┘
```

---

## Service 3: RSS / Atom Feed + Webhooks

Mission events are inherently feed-shaped. Low effort, high community value.

### Feed: `/feed/events.xml`

```xml
<rss version="2.0">
  <channel>
    <title>Artemis II Mission Events</title>
    <link>https://artemisee.dev</link>
    <description>Real-time Artemis II mission milestones and events</description>
    <item>
      <title>Translunar Injection Burn Complete</title>
      <description>Orion has completed its 5m 55s TLI burn (Δv=388 m/s).
        Now on course for the Moon. Distance from Earth: 42,000 km.</description>
      <pubDate>Wed, 02 Apr 2026 23:54:00 GMT</pubDate>
      <category>burn</category>
      <guid>artemisee:event:tli-complete</guid>
    </item>
  </channel>
</rss>
```

### Event Types for Feed Items

- **Milestones:** Launch, TLI, lunar SOI entry/exit, closest approach, splashdown
- **Burns:** Each trajectory correction burn (planned + confirmation)
- **DSN contacts:** Antenna acquisition/loss of signal
- **Nav updates:** When new tracking solutions are uploaded (detected via cache diff)
- **Anomalies:** Significant deviation from planned trajectory

### Webhook Dispatch

```
POST https://your-webhook-url.com/artemis
Content-Type: application/json

{
  "event": "milestone",
  "name": "Lunar sphere of influence entry",
  "utc": "2026-04-06T04:43:00Z",
  "met": "4/06:08",
  "data": {
    "distance_earth_km": 326000,
    "distance_moon_km": 58000,
    "velocity_kms": 0.82
  }
}
```

Register webhooks via API: `POST /v1/webhooks { url, events: ["milestone", "burn"] }`

Ideal targets: Slack incoming webhooks, Discord bot channels, Home Assistant automations.

---

## Architecture Summary

```
                    ┌─────────────────────────────────────────┐
                    │          JPL Horizons API                │
                    │    ssd.jpl.nasa.gov/api/horizons.api    │
                    └───────────────┬─────────────────────────┘
                                    │ (1 req at a time, no CORS)
                    ┌───────────────▼─────────────────────────┐
                    │         Horizons Cache Layer             │
                    │  - Batch fetch full trajectory           │
                    │  - 1-6 hour TTL                          │
                    │  - Hermite interpolation for sub-step     │
                    │  - astronomy-engine for Moon/Earth pos   │
                    │  - Event timeline from mission manifest  │
                    └──┬──────────┬──────────────┬────────────┘
                       │          │              │
              ┌────────▼──┐ ┌────▼───────┐ ┌────▼──────────┐
              │  REST API  │ │ MCP Server │ │  RSS + Hooks  │
              │  /v1/*     │ │  7 tools   │ │  /feed/*.xml  │
              │  JSON      │ │  via GW    │ │  webhooks     │
              └────────────┘ └────────────┘ └───────────────┘
                    │
              ┌─────▼──────┐
              │ React       │
              │ Frontend    │
              │ (3D tracker)│
              └─────────────┘
```

---

## Implementation Priority

1. **REST API** — You need it for the frontend anyway. Ship `/v1/position`, `/v1/trajectory`, `/v1/events` first.
2. **MCP Server** — Register as first service in MCP Gateway. Start with `get_spacecraft_position`, `can_i_see_artemis`, `get_mission_events`.
3. **RSS Feed** — Side-effect of event timeline processing. Generate on each cache refresh.
4. **Webhooks** — Add after RSS proves the event detection logic works.
5. **`compare_planned_vs_actual`** — Requires storing historical nav solutions; add once cache diffing is in place.
6. **DSN integration** — Depends on reverse-engineering DSN Now XML feed; community libraries exist.

---

## Key Technical Decisions Still Open

- **Go vs Python for MCP server?** Go aligns with MCP Gateway; Python has `astronomy-engine` PyPI package and `fastmcp`. Go has `astronomy-engine` as a C library with CGo bindings (heavier). Could do REST+Gateway in Go, MCP tools in Python behind the gateway.
- **Supabase Edge Function vs standalone service?** Edge Function reuses infra but limits to Deno. Standalone Go service is cleaner for gateway routing.
- **Cache storage:** In-memory (simplest), Supabase Postgres (durable), Redis (shared across instances)?
- **Event detection:** Static timeline from mission manifest vs dynamic detection from trajectory analysis?
- **Public API auth:** API keys for rate limiting, or fully open with IP-based throttling?
