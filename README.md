# Agent Office

A pixel-art virtual office for AI agent teams. Agents have live presence states, sit in themed rooms, respond to chat messages, and execute real tasks via Claude Code — all rendered in a retro-styled shared workspace.

> [!WARNING]
> **Early Development** — This project is under active development and may not work as expected.
> APIs, configuration, and features may change without notice. Use at your own risk.

[![CI](https://github.com/fwartner/agent-office/actions/workflows/ci.yml/badge.svg)](https://github.com/fwartner/agent-office/actions/workflows/ci.yml)
[![Docker](https://github.com/fwartner/agent-office/actions/workflows/docker.yml/badge.svg)](https://github.com/fwartner/agent-office/actions/workflows/docker.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Vite](https://img.shields.io/badge/Vite-5-646cff)
![License](https://img.shields.io/badge/License-MIT-green)

## Screenshot

![Agent Office screenshot](assets/readme/virtual-office-screenshot.jpg)

## Features

- **Pixel-art office map** — agents rendered as animated sprites on a tiled office floor
- **Live presence** — real-time status per agent (active, available, paused, blocked, in meeting, off hours)
- **Room navigation** — click rooms to see occupants and their current work
- **Agent CRUD** — create, edit, and delete agents directly from the UI
- **Task assignment** — queue tasks with priority, routing to Claude Code agent runtime
- **Chat with agents** — send messages to individual agents or broadcast to all; agents respond via runtime
- **Speech bubbles** — agents show live status bubbles on the map (task start, output, completion, errors)
- **Markdown rendering** — all content (chat, tasks, results, activity) rendered as markdown
- **Auto-save results** — task results automatically saved to disk, no manual action needed
- **Activity feed** — chronological log of assignments, presence changes, and system events
- **Decisions & voting** — propose, accept, or reject decisions collaboratively
- **Workday awareness** — configurable office hours with timezone, days, and hours support
- **Telegram bot** — full agent management via inline keyboards; chat messages bridged to/from office
- **Integrations** — Slack, GitHub, and Linear adapters for event notifications
- **Webhooks** — configurable webhooks with HMAC signing and retry logic
- **SSE real-time updates** — server-sent events for instant UI updates (no polling delay)
- **Three-column layout** — resizable panels with room tree, map viewport, and detail sidebar
- **Accessible (WCAG 2.1 AA)** — skip link, ARIA landmarks, keyboard navigation, focus indicators
- **Mobile responsive** — breakpoints at 900/600/400px with touch-friendly targets
- **Dual backend** — SQLite (zero-config) or PostgreSQL via `DATABASE_URL`
- **Docker support** — multi-stage Dockerfile with health checks, published to GHCR
- **Error resilience** — ErrorBoundary, connection banners, sprite fallbacks, input validation

## Required Assets

This project uses the **Office Tileset** by [Donarg](https://donarg.itch.io/officetileset), which is a paid asset and **not included in this repository**. You must purchase and install it before running the app:

1. Purchase the tileset from [https://donarg.itch.io/officetileset](https://donarg.itch.io/officetileset)
2. Extract the downloaded archive into `assets/pixelart/Office Tileset/`
3. Copy the office map to the expected location:
   ```bash
   cp "assets/pixelart/Office Tileset/Office Designs/Office Level 4.png" assets/pixelart/office-map.png
   ```

Without this asset the map background will be missing, but the rest of the UI will still function.

## Quick Start

```bash
git clone https://github.com/fwartner/agent-office.git
cd agent-office
npm install
```

The **setup wizard** runs automatically after `npm install`. It walks you through:

1. **Backend selection** — SQLite (zero config) or PostgreSQL
2. **Server port** — defaults to 4173
3. **Office timezone** — auto-detected from your system
4. **Telegram bot** — optional bot token for Telegram integration
5. **Integrations** — optional Slack, GitHub, Linear configuration

Then start developing:

```bash
npm run dev
```

### Setup Options

```bash
npm run setup          # re-run the wizard interactively
npm run setup:force    # re-run even if already completed
npm run setup:auto     # accept all defaults (non-interactive, CI-friendly)
```

## Deploy with Docker

```bash
docker pull ghcr.io/fwartner/agent-office:latest
docker run -p 4173:4173 -v agent-office-state:/app/state ghcr.io/fwartner/agent-office:latest
```

Or use Docker Compose:

```bash
docker compose up -d
```

## Deploy with Claude Code

Paste the following prompt into [Claude Code](https://claude.ai/code) to clone, set up, and run the project:

```
Clone https://github.com/fwartner/agent-office.git, run npm install (which triggers
the setup wizard), then start the dev server with npm run dev. Open the URL it prints
in my browser. If Postgres is not available, choose the SQLite backend when the
wizard asks.
```

## Configuration

The wizard writes a `.env` file. You can also create one manually:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string (omit for SQLite) |
| `PORT` | `4173` | Server port |
| `TELEGRAM_BOT_TOKEN` | — | Telegram bot token for bot integration |
| `SLACK_WEBHOOK_URL` | — | Slack incoming webhook URL |
| `GITHUB_TOKEN` | — | GitHub personal access token |
| `GITHUB_WEBHOOK_SECRET` | — | Secret for verifying GitHub webhooks |
| `LINEAR_API_KEY` | — | Linear API key for task sync |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Build server + frontend for production |
| `npm run build:server` | Build server modules only (tsup) |
| `npm run serve` | Run production server (requires prior build) |
| `npm run serve:build` | Build and serve in one step |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type check frontend + server |
| `npm run db:generate` | Generate Drizzle ORM migrations |
| `npm run db:push` | Push schema to database |

## Project Structure

```
src/
  App.tsx                    # Main UI — map, panels, agent sprites
  office-provider.tsx        # React context — polling, SSE, state, CRUD
  data.ts                    # Seed data — agents, rooms, seats, policy
  world.ts                   # Sprite definitions, animation data
  office-state.ts            # TypeScript type definitions
  styles.css                 # All styles — responsive, a11y, theming
  components/
    map/                     # AgentSprite, SpeechBubble, RoomOverlay
    sidebar/                 # AgentDetailPanel, TasksPanel, ChatPanel, ActivityFeed
    forms/                   # AgentForm, AssignmentForm, CompleteTaskForm
    layout/                  # ThreeColumnLayout, LeftSidebar, RightSidebar
    shared/                  # Markdown, TaskResultDisplay, ToastContainer
  hooks/                     # useSSE, useSpriteFrame
  utils/                     # presence helpers, time formatting
  server/
    api-routes.ts            # Shared API route handlers (pure functions)
    validation.ts            # Validation constants and helpers
    events.ts                # EventEmitter-based pub/sub
    sse.ts                   # Server-Sent Events manager
    drizzle-context.ts       # Drizzle ORM storage adapter
    json-context.ts          # JSON file storage adapter
    webhook-dispatcher.ts    # Webhook delivery with HMAC + retry
    integrations/            # Slack, GitHub, Linear adapters
  db/
    schema.ts                # Drizzle ORM schema (SQLite)
    schema-pg.ts             # Drizzle ORM schema (PostgreSQL)
    migrate.ts               # Auto-migration runner
    seed.ts                  # Seed data for empty databases
  bot/
    index.ts                 # Telegram bot init
    commands.ts              # Bot command handlers
    callbacks.ts             # Inline keyboard handlers
    conversations.ts         # Multi-step flows
    notifications.ts         # Push notifications
  __tests__/                 # Unit and component tests
agent-runtime.mjs            # Claude Code agent process manager
server.mjs                   # Production HTTP server
vite.config.ts               # Vite config with dev API plugin
Dockerfile                   # Multi-stage Docker build
docker-compose.yml           # Full stack compose
```

## API Endpoints

All endpoints are available in both dev (Vite plugin) and production (`server.mjs`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (status, version, DB type, uptime) |
| GET | `/api/office/snapshot` | Full office state |
| POST | `/api/office/agent` | Create agent |
| PUT | `/api/office/agent/:id` | Full update |
| PATCH | `/api/office/agent/:id` | Partial update (whitelisted fields) |
| DELETE | `/api/office/agent/:id` | Delete agent + cascade |
| POST | `/api/office/assign` | Queue task assignment |
| PATCH | `/api/office/assignment/:id` | Update assignment status |
| GET | `/api/office/assignments` | Query assignments with filters |
| POST | `/api/office/activity` | Log activity entry |
| POST | `/api/office/decision` | Create decision |
| PATCH | `/api/office/decision/:id` | Update decision |
| POST | `/api/office/message` | Send chat message |
| GET | `/api/office/messages` | Query messages |
| POST | `/api/office/room` | Create room |
| PUT | `/api/office/room/:id` | Update room |
| DELETE | `/api/office/room/:id` | Delete room |
| POST | `/api/office/webhook` | Create webhook |
| DELETE | `/api/office/webhook/:id` | Delete webhook |
| PATCH | `/api/office/settings` | Update settings |
| GET | `/api/sse` | Server-Sent Events stream |

### Input Validation

- 1MB body size limit on all endpoints
- String length limits: name (100), role (200), title (200), brief (2000), focus (500), system prompt (5000), message (2000)
- Field whitelist on agent PATCH: presence, focus, roomId, criticalTask, collaborationMode, xPct, yPct, systemPrompt
- Enum validation on presence, priority, routing target, assignment status
- Agent ID format: lowercase alphanumeric with hyphens only (`/^[a-z0-9-]+$/`)

## Database

Default storage is **SQLite** via Drizzle ORM (zero configuration). Set `DATABASE_URL` for **PostgreSQL**. Legacy JSON file fallback is still supported.

Migrations run automatically on startup via `src/db/migrate.ts`.

## Agent Runtime

The agent runtime (`agent-runtime.mjs`) spawns Claude Code subprocesses to execute tasks:

- Agents are registered with system prompts and runtime config (max turns, timeout, working directory, allowed tools)
- Tasks are dispatched via `claude -p` with JSON output parsing
- Results are posted back as chat messages (for chat-sourced tasks) and auto-saved to `state/results/`
- Speech bubbles show real-time progress on the map
- Working directory defaults to project root when not specified per-agent

## Telegram Bot

Set `TELEGRAM_BOT_TOKEN` to enable the Telegram bot. Available commands:

| Command | Description |
|---------|-------------|
| `/start` | Main menu |
| `/agents` | List all agents |
| `/tasks` | List active tasks |
| `/rooms` | List rooms |
| `/status` | Dashboard summary |
| `/assign` | Assign a task (guided flow) |
| `/decide` | Propose a decision |

Text messages sent to the bot are forwarded to the office chat. Office events (task completions, chat messages, presence changes) are pushed to Telegram.

## Testing

```bash
npm test
```

201 tests across 15 test files covering:

- **Data integrity** — agents reference valid rooms, seats exist, zones in bounds
- **Sprite logic** — presence-based sprite selection, animation data, fallbacks
- **Error boundary** — fallback UI rendering and recovery
- **Type contracts** — office state record shapes
- **Server validation** — field whitelist, presence enum, required fields, body limits
- **App components** — rendering, navigation, tab switching, agent selection
- **Agent CRUD** — create/edit/delete forms, ID validation, confirmation flow
- **Task results** — auto-save behavior, markdown rendering, result display
- **Office provider** — state management, snapshot validation, assignment merging
- **Accessibility** — skip link, ARIA roles, labels, keyboard access
- **Settings** — office name, timezone, theme colors, workday policy
- **Bot formatters** — Telegram message formatting and escaping

## Accessibility

- Skip-to-content link
- `<main>` landmark with ARIA tab roles
- Keyboard navigation for all interactive elements (Enter/Space/Escape/Arrow keys)
- `:focus-visible` indicators
- `aria-live="polite"` on activity feed
- `role="alert"` on connection errors
- Form labels (visually hidden where needed)
- Decorative elements marked `aria-hidden="true"`
- Reduced motion support (`prefers-reduced-motion`)
- Windows High Contrast mode support (`forced-colors`)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

[MIT](LICENSE)

## Maintainer

**Florian Wartner** — [Pixel & Process](https://pixelandprocess.de)
Email: [florian@wartner.io](mailto:florian@wartner.io)
