# ⚽ GoalDigger

> **A learning project** built to deeply understand real-time WebSocket architecture, backend API design, database modelling, and modern full-stack development patterns.

This is not a production application. It was built intentionally — concept by concept — as a hands-on way to explore how live sports platforms like ESPN, Cricbuzz, or BBC Sport work under the hood.

---

## What This Project Covers

| Concept | Implementation |
|---|---|
| WebSocket server from scratch | `ws` library, `noServer` mode, manual upgrade handling |
| Pub/Sub architecture | Per-match subscriber maps, two independent channels |
| Real-time broadcasting | Commentary and match events pushed to subscribed clients |
| Heartbeat / zombie detection | Ping/pong with `isAlive` flag, periodic cleanup |
| REST API design | Express 5, route separation, query/body validation |
| Schema validation | Zod schemas with coercion, custom refinements, derived types |
| Database ORM | Drizzle ORM with PostgreSQL, typed schema, relations |
| API security | Arcjet — rate limiting, bot detection, shield protection |
| Frontend state | Zustand store with derived selectors, optimistic updates |
| WebSocket client | Singleton manager, exponential backoff reconnect |
| Real-time UI | Next.js 15, auto-scroll commentary feed, live animations |
| Deployment | Render, environment config, TSX for Node.js TS execution |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GoalDigger                           │
│                                                             │
│   ┌──────────────┐         ┌──────────────────────────┐    │
│   │   Next.js    │ ←HTTP→  │      Express (: 8000)    │    │
│   │  Frontend    │         │                          │    │
│   │  (:3001)     │ ←WS──→  │   WebSocket Server       │    │
│   └──────────────┘         │   /ws endpoint           │    │
│                             └──────────┬─────────────┘    │
│                                        │                    │
│                             ┌──────────▼─────────────┐    │
│                             │   PostgreSQL (Neon)     │    │
│                             │   matches + commentary  │    │
│                             └────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### WebSocket Pub/Sub Model

Clients subscribe to two independent channels per match:

```
Client → { type: "subscribe",             matchId: 1 }  → Match updates
Client → { type: "subscribe_commentary",  matchId: 1 }  → Live commentary

Server → { type: "match_created",  data: {...} }        → Broadcast to all clients
Server → { type: "commentary",     data: {...} }        → Commentary subscribers only
Server → { type: "match_update",   data: {...} }        → Match subscribers only
```

This separation means a scoreboard client doesn't get flooded with every commentary event, and a commentary reader doesn't need to care about match metadata changes. Each subscriber map is keyed by `matchId`:

```ts
const matchSubscribers      = new Map<number, Set<WebSocket>>();
const commentarySubscribers = new Map<number, Set<WebSocket>>();
```

---

## Project Structure

```
sportz/
├── server.ts                    # Entry point — Express + WebSocket setup
├── arcjet.ts                    # Security middleware (rate limiting, bot detection)
│
├── src/
│   ├── routes/
│   │   ├── matches.ts           # GET/POST /matches
│   │   └── commentary.ts        # GET/POST /matches/:id/commentary
│   │
│   ├── validation/
│   │   ├── matches.ts           # Zod schemas for match endpoints
│   │   └── commentary.ts        # Zod schemas for commentary endpoints
│   │
│   ├── ws/
│   │   └── server.ts            # WebSocket server, pub/sub, heartbeat
│   │
│   ├── db/
│   │   ├── db.ts                # Drizzle + pg pool setup
│   │   ├── schema.ts            # matches + commentary table definitions
│   │   └── seed.ts              # Bulk seed script (150 matches, ~2000 commentary)
│   │
│   └── utils/
│       └── matchStatus.ts       # Derive status from start/end timestamps
│
├── frontend/                    # Next.js 15 frontend (GoalDigger UI)
│   ├── app/
│   │   ├── page.tsx             # Match list home page
│   │   ├── matches/[id]/page.tsx # Match detail + live commentary
│   │   └── dev/page.tsx         # Dev panel — WS testing tools
│   │
│   ├── components/              # MatchCard, ScoreBoard, CommentaryFeed, etc.
│   ├── lib/
│   │   ├── websocket.ts         # WS singleton with exponential backoff reconnect
│   │   ├── enrich.ts            # Raw API response → enriched UI types
│   │   └── eventMeta.ts         # eventType → icon / colour / highlight mapping
│   │
│   └── store/
│       └── useStore.ts          # Zustand global state + derived selectors
│
├── drizzle/                     # Auto-generated SQL migrations
├── render.yaml                  # Render deployment config
└── drizzle.config.ts
```

---

## Database Schema

```sql
CREATE TYPE match_status AS ENUM ('scheduled', 'live', 'finished');

CREATE TABLE matches (
  id         SERIAL PRIMARY KEY,
  sport      TEXT NOT NULL,
  home_team  TEXT NOT NULL,
  away_team  TEXT NOT NULL,
  status     match_status DEFAULT 'scheduled' NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time   TIMESTAMP,
  home_score INTEGER DEFAULT 0 NOT NULL,
  away_score INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE commentary (
  id         SERIAL PRIMARY KEY,
  match_id   INTEGER REFERENCES matches(id) NOT NULL,
  minute     INTEGER,
  sequence   INTEGER NOT NULL,
  period     TEXT,                  -- e.g. "first_half", "set_2", "innings_1"
  event_type TEXT NOT NULL,         -- e.g. "goal", "wicket", "ace"
  actor      TEXT,                  -- player name
  team       TEXT,
  message    TEXT NOT NULL,
  metadata   JSONB,
  tags       TEXT[],
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

---

## API Reference

### Matches

```http
GET /matches
    ?sport=football
    &status=live|scheduled|finished
    &limit=50
    &offset=0

POST /matches
Content-Type: application/json
{
  "sport":     "football",
  "homeTeam":  "Arsenal",
  "awayTeam":  "Chelsea",
  "startTime": "2026-03-18T15:00:00Z",
  "endTime":   "2026-03-18T17:00:00Z",
  "homeScore": 0,
  "awayScore": 0
}
```

### Commentary

```http
GET /matches/:matchId/commentary
    ?limit=50

POST /matches/:matchId/commentary
Content-Type: application/json
{
  "minutes":   23,
  "sequence":  1,
  "period":    "first_half",
  "eventType": "goal",
  "actor":     "Bukayo Saka",
  "team":      "Arsenal",
  "message":   "GOAL! Saka fires into the top corner!"
}
```

### WebSocket

Connect to `ws://localhost:8000/ws`

| Direction | Message |
|---|---|
| Client → Server | `{ type: "subscribe", matchId: number }` |
| Client → Server | `{ type: "unsubscribe", matchId: number }` |
| Client → Server | `{ type: "subscribe_commentary", matchId: number }` |
| Client → Server | `{ type: "unsubscribe_commentary", matchId: number }` |
| Server → Client | `{ type: "Welcome" }` on connect |
| Server → Client | `{ type: "match_created", data: Match }` broadcast to all |
| Server → Client | `{ type: "commentary", data: Commentary }` to subscribers |

---

## Security — Arcjet

Two separate Arcjet clients protect HTTP and WebSocket upgrades independently:

```
HTTP   → 50 requests / 10 seconds (sliding window per IP)
WS     →  5 requests /  2 seconds (stricter — upgrade-time check only)

Shield          → blocks SQL injection, XSS, path traversal attempts
Bot detection   → blocks scrapers, allows legitimate crawlers
```

Set `ARCJET_MODE=DRY_RUN` to log-only (safe for development) or `LIVE` to actively block. The WebSocket rate limit fires during the HTTP upgrade handshake — once the connection is established, the client is trusted for its session.

---

## Heartbeat & Zombie Connection Cleanup

Every 10 seconds the server runs a cleanup cycle:

```ts
const interval = setInterval(() => {
  cleanUpSubscriptions();         // 1. Remove dead sockets from subscriber maps
  wss.clients.forEach((ws) => {
    if (!extWs.isAlive) {         // 2. Terminate connections that didn't pong
      ws.terminate(); return;
    }
    extWs.isAlive = false;        // 3. Mark all live connections as unconfirmed
    ws.ping();                    // 4. Ask them to prove they're still there
  });
}, 10000);

ws.on('pong', () => { extWs.isAlive = true; }); // Client responds → confirmed alive
```

The key detail: `cleanUpSubscriptions()` runs **before** setting `isAlive = false`. This ensures only connections that failed the *previous* cycle get removed. Running cleanup after the ping would wipe every active subscriber immediately — a bug that existed in early development and was fixed.

---

## Frontend

Built with **Next.js 15**, **TailwindCSS v4**, and **Zustand**.

### Pages

| Route | Description |
|---|---|
| `/` | Match list — grouped by Live / Upcoming / Results with sport filter pills |
| `/matches/:id` | Match detail — dark scoreboard, live commentary feed with animations |
| `/dev` | Dev panel — subscribe controls, event simulator, raw WS message log |

### WebSocket Manager (Singleton)

`frontend/lib/websocket.ts` manages the entire connection lifecycle:

- Single instance shared across the whole app
- Exponential backoff on disconnect: `1s → 2s → 4s → 8s → 15s → 30s`
- Status events: `connecting | connected | reconnecting | disconnected | error`
- Message routing via registered handlers (decoupled from the store)
- Outbound message logging for the dev panel

### Zustand State

```ts
{
  connectionStatus:        'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
  matches:                 EnrichedMatch[]          // seeded from REST on mount
  commentary:              Record<number, Entry[]>  // capped at 100 per match
  subscribedMatchIds:      number[]                 // arrays (not Sets) for reactivity
  subscribedCommentaryIds: number[]
  pendingSubscriptions:    PendingSubscription[]    // optimistic subscribe state

  // Derived selectors (computed, not stored)
  getMatchById(id):             EnrichedMatch | undefined
  isSubscribedToMatch(id):      boolean
  isSubscribedToCommentary(id): boolean
  getCommentaryForMatch(id):    Entry[]
  isPending(matchId, type):     boolean
}
```

Subscriptions use **arrays** (not `Set`) so Zustand's shallow equality check detects changes and triggers re-renders. Subscribing is **optimistic** — the UI updates immediately and confirms after 400ms, since the backend sends no subscription ACK.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- PostgreSQL database (or a free [Neon](https://neon.tech) instance)
- [Arcjet](https://arcjet.com) API key (free tier available)

### Backend

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Fill in DATABASE_URL, ARCJET_KEY, etc.

# Run database migrations
bun run db:migrate

# Seed with sample data (150 matches, ~2000 commentary entries)
bun run db:seed

# Development (watch mode)
bun run dev

# Production
bun run start
```

### Frontend

```bash
cd frontend
bun install
bun run dev
# → http://localhost:3001
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `ARCJET_KEY` | Arcjet API key | `ajkey_...` |
| `ARCJET_ENVIRONMENT` | Arcjet environment | `production` |
| `ARCJET_MODE` | `DRY_RUN` (log only) or `LIVE` (block) | `DRY_RUN` |
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |

---

## Deployment

Deployed on [Render](https://render.com). Since Render uses Node.js rather than Bun, `tsx` is used to execute TypeScript directly — it handles ESM imports without requiring explicit `.js` file extensions, which plain Node.js ESM demands.

```yaml
# render.yaml
buildCommand: npm install
startCommand: npm start   # → tsx server.ts
```

---

## Key Things Learned

**Heartbeat order is everything.** Running cleanup before pinging (not after) is what separates "removes dead connections" from "removes all connections". This was an actual bug that silently wiped every subscription every 10 seconds.

**WebSocket complexity lives in the edges.** Connecting is trivial. Handling disconnects, zombie clients, subscription cleanup, reconnect backoff, and memory leak prevention is where the real design decisions are.

**Zod at the boundary, trust types everywhere else.** Validate at the HTTP entry point and let TypeScript carry the types from there. No redundant checks in business logic.

**Pub/Sub needs two channels.** A single subscription carrying both score updates and commentary would flood low-bandwidth clients. Separating them lets consumers choose exactly what they care about.

**Optimistic UI is deceptively simple.** Update immediately, confirm later. The perceived responsiveness improvement is significant even for latencies under 500ms.

**Arrays over Sets in Zustand.** Zustand uses shallow equality. Mutating a `Set` returns the same reference — no re-render. Arrays with spread create new references — re-render guaranteed.

---

## Tech Stack

**Backend:** Node.js · TypeScript · Express 5 · WebSocket (`ws`) · Drizzle ORM · PostgreSQL · Zod · Arcjet · tsx

**Frontend:** Next.js 15 · React 19 · TypeScript · TailwindCSS v4 · Zustand · Lucide Icons

**Infrastructure:** Neon (PostgreSQL) · Render (hosting) · Bun (local runtime + package manager)

---

*Built for learning. Not for production.*
