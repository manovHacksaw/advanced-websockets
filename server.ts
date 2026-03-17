import express, { Request, Response } from 'express';
import { matchRouter } from './src/routes/matches';
import { attachWebSocketServer } from './src/ws/server';
import { securityMiddleware } from './arcjet'
import http from 'http'

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "0.0.0.0";


const server = http.createServer(app);


// JSON Middleware
app.use(express.json());

app.use(securityMiddleware());



// Root GET route
app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Sportz API!' });
});

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start the server
server.listen(Number(PORT), HOST as string, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket server is running on ${baseUrl.replace('http', 'ws')}/ws`);
    console.log(`Arcjet Environment: ${process.env.ARCJET_ENVIRONMENT}`);
});