import AgentAPI from "apminsight"
AgentAPI.config();


import express, { Request, Response } from 'express';
import cors from 'cors';
import { matchRouter } from './src/routes/matches';
import { attachWebSocketServer } from './src/ws/server';
// import { securityMiddleware } from './arcjet'
import http from 'http'
import { commentaryRouter } from './src/routes/commentary';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";


const server = http.createServer(app);


// CORS
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));

// JSON Middleware
app.use(express.json());

// app.use(securityMiddleware());



// Root GET route
app.get('/', (_req: Request, res: Response) => {
    const uptime = process.uptime();
    const uptimeStr = uptime < 60
        ? `${Math.floor(uptime)}s`
        : uptime < 3600
        ? `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`
        : `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GoalDigger API</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f0f;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 480px;
      width: 100%;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 2rem;
    }
    .logo { font-size: 2rem; }
    .title { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; }
    .title span { color: #22c55e; }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #052e16;
      border: 1px solid #166534;
      color: #4ade80;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 1.5rem;
    }
    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 1.5rem;
    }
    .stat {
      background: #111;
      border: 1px solid #222;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .stat-label { font-size: 0.65rem; color: #555; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .stat-value { font-size: 0.95rem; font-weight: 700; color: #e5e5e5; }
    .divider { border: none; border-top: 1px solid #222; margin: 1.5rem 0; }
    .endpoints { display: flex; flex-direction: column; gap: 8px; }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
    }
    .method {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      min-width: 38px;
      text-align: center;
    }
    .get  { background: #0c2a1a; color: #4ade80; }
    .post { background: #1a1a0c; color: #facc15; }
    .ws   { background: #0c1a2a; color: #60a5fa; }
    .path { color: #888; font-family: monospace; }
    .section-title {
      font-size: 0.65rem;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="logo">⚽</span>
      <div>
        <div class="title">Goal<span>Digger</span></div>
      </div>
    </div>

    <div class="badge">
      <span class="dot"></span>
      Backend operational
    </div>

    <div class="grid">
      <div class="stat">
        <div class="stat-label">Environment</div>
        <div class="stat-value">${process.env.NODE_ENV ?? 'development'}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Port</div>
        <div class="stat-value">${PORT}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Uptime</div>
        <div class="stat-value">${uptimeStr}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Node</div>
        <div class="stat-value">${process.version}</div>
      </div>
    </div>

    <hr class="divider" />

    <p class="section-title">Endpoints</p>
    <div class="endpoints">
      <div class="endpoint"><span class="method get">GET</span><span class="path">/matches</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/matches</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/matches/:id/commentary</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/matches/:id/commentary</span></div>
      <div class="endpoint"><span class="method ws">WS</span><span class="path">/ws</span></div>
    </div>
  </div>
</body>
</html>`);
});

app.use("/matches", matchRouter);
app.use("/matches/:matchId/commentary", commentaryRouter);

const { broadcastMatchCreated, broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

// Start the server
server.listen(Number(PORT), HOST as string, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
    console.log(`Arcjet Environment: ${process.env.ARCJET_ENVIRONMENT}`);
});