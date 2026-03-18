# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Clawd Office is a pixel-art virtual office for AI agent teams. Agents have live presence states, sit in themed rooms, and can be managed through a retro-styled UI. Early development — APIs and features may change without notice.

## Commands

```bash
npm run dev           # Start Vite dev server (http://localhost:4173)
npm run build         # TypeScript check + Vite build (tsc -b && vite build)
npm test              # Run all tests (vitest run)
npm run test:watch    # Tests in watch mode
npm run typecheck     # Type check only (tsc --noEmit)
npm run serve:build   # Build + start production server
npm run setup:force   # Re-run interactive setup wizard
npm run setup:auto    # Non-interactive setup (CI-friendly)
```

Run a single test file: `npx vitest run src/__tests__/app.test.tsx`

## Architecture

**Frontend:** React 18 + TypeScript 5.6 + Vite 5. Single-page app with pixel-art map, animated sprites, room navigation, agent CRUD forms, task assignment, and activity feed.

**Backend:** Node.js server (`server.mjs` for production, Vite plugin in `vite.config.ts` for dev). Both implement identical REST API endpoints. Dual storage: Postgres primary with automatic JSON file fallback (`state/office-snapshot.json`).

**Data flow:** `OfficeProvider` (React context) polls `GET /api/office/snapshot` every 2-3 seconds. Mutations go through provider methods → POST/PATCH/DELETE endpoints → state file or DB → next poll picks up changes.

### Key Files

| File | Role |
|------|------|
| `src/App.tsx` | Main UI — map canvas, room overlays, agent sprites, sidebar panels, forms |
| `src/office-provider.tsx` | React context — polling, state management, CRUD wrappers, validation |
| `src/data.ts` | Seed data — agents, rooms, seats, workday policy |
| `src/world.ts` | Sprite definitions, animation metadata, character sets |
| `src/office-state.ts` | TypeScript type definitions (designed for future Postgres migration) |
| `vite.config.ts` | Vite config + dev API plugin with all endpoint handlers and validation constants |
| `server.mjs` | Production HTTP server — duplicates API logic from vite.config.ts |
| `sql/office_state_schema.sql` | Postgres schema (8 tables with indexes) |

### API Endpoints

All endpoints are defined in both `vite.config.ts` (dev) and `server.mjs` (prod):

- `GET /api/office/snapshot` — full state
- `POST /api/office/agent` — create agent
- `PUT /api/office/agent/:id` — full update
- `PATCH /api/office/agent/:id` — partial update (whitelisted fields only)
- `DELETE /api/office/agent/:id` — remove agent + cascade
- `POST /api/office/assign` — queue task
- `PATCH /api/office/assignment/:id` — update assignment status
- `POST /api/office/activity` — log activity

### Validation Constants (duplicated in vite.config.ts and server.mjs)

- Agent IDs: `/^[a-z0-9-]+$/` (kebab-case)
- Presence enum: `off_hours, available, active, in_meeting, paused, blocked`
- PATCH whitelist: `presence, focus, roomId, criticalTask, collaborationMode`
- String limits: name (100), role (200), title (200), brief (2000), focus (500)
- Body limit: 1MB

## Testing

Tests live in `src/__tests__/` (component/unit, 9 files) and `tests/` (API integration, 2 files). ~149 tests total covering data integrity, sprites, error boundary, provider logic, UI rendering, agent CRUD, accessibility, and API validation.

## Code Conventions

- TypeScript strict mode — no `any` types
- Functional React with hooks only (except ErrorBoundary)
- All CSS in `src/styles.css` — no CSS-in-JS, uses CSS custom properties
- Pixel-art aesthetic with Press Start 2P font — keep retro theme consistent
- WCAG 2.1 AA accessibility: ARIA landmarks, keyboard navigation, focus indicators
- Commit messages: conventional style (`fix:`, `feat:`, `test:`, etc.)
- No separate linter configured — TypeScript strict mode is the quality gate
