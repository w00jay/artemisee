# Artemisee — Project Instructions

## Release Process

1. Bump `version` in `package.json` (single source of truth — UI reads it via import)
2. Run `tsc -b --noEmit`, `vitest run`, and `vite build` — all must pass
3. Commit with message: `chore: bump version to vX.Y.Z`
4. Push to main
5. Create GitHub release: `gh release create vX.Y.Z --title "vX.Y.Z — <title>" --notes "<notes>"`
6. The version tag in the UI (InfoLinks bar) links to the release page automatically

Use semver: patch for fixes, minor for features, major for breaking changes.

## Project Structure

- `src/` — React frontend (Three.js 3D scene + UI overlay)
- `server/` — Express API server (proxy routes + data layer)
- `server/mcp/` — MCP server for LLM tool access
- `src/lib/missions.ts` — Mission definitions (Artemis I, II, future missions)
- `src/lib/constants.ts` — Shared constants + Horizons query builder

## Key Patterns

- All external API routes go in `server/routes/v1/` and use `cacheGet`/`cacheSet` from `server/cache.ts`
- UI panels use the `<Panel>` component from `src/ui/Overlay.tsx` for consistent glassmorphism styling
- Mission-dependent components read `activeMission` from the zustand store and call `getMission()` — never hardcode mission dates
- Frontend data fetching uses `@tanstack/react-query`

## Validation Before Commit

- `npx tsc -b --noEmit` — type check
- `npx vitest run` — tests
- `npx vite build` — production build
