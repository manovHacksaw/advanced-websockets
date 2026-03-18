import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../../arcjet";

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
}

// Module-level so broadcastToAll and broadcastToMatch can access it
let wss: WebSocketServer;

const matchSubscribers = new Map<number, Set<WebSocket>>();
const commentarySubscribers = new Map<number, Set<WebSocket>>();

function subscribeToMatch(matchId: number, ws: WebSocket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId)!.add(ws);
}

function unsubscribeFromMatch(matchId: number, ws: WebSocket) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) return;
    subscribers.delete(ws);
    if (subscribers.size === 0) {
        matchSubscribers.delete(matchId);
    }
}

function subscribeToCommentary(matchId: number, ws: WebSocket) {
    if (!commentarySubscribers.has(matchId)) {
        commentarySubscribers.set(matchId, new Set());
    }
    commentarySubscribers.get(matchId)!.add(ws);
}

function unsubscribeFromCommentary(matchId: number, ws: WebSocket) {
    const subscribers = commentarySubscribers.get(matchId);
    if (!subscribers) return;
    subscribers.delete(ws);
    if (subscribers.size === 0) {
        commentarySubscribers.delete(matchId);
    }
}

export function broadcastToMatch<T extends object>(matchId: number, payload: T) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) return;
    for (const ws of subscribers) {
        sendJSON(ws, payload);
    }
}

export function broadcastCommentary<T extends object>(matchId: number, payload: T) {
    const subscribers = commentarySubscribers.get(matchId);
    if (!subscribers) return;
    for (const ws of subscribers) {
        sendJSON(ws, payload);
    }
}

export function broadcastToAll<T extends object>(payload: T) {
    for (const ws of wss.clients) {
        sendJSON(ws, payload);
    }
}

/**
 * Parses and handles an incoming WebSocket message.
 * Mutates subscribedMatchIds and subscribedCommentaryIds for cleanup on close.
 */
export function handleMessage(
    socket: WebSocket,
    subscribedMatchIds: Set<number>,
    subscribedCommentaryIds: Set<number>,
    data: Buffer
) {
    let message: { type: string; matchId?: number };
    try {
        message = JSON.parse(data.toString());
    } catch {
        return;
    }

    if (!Number.isInteger(message?.matchId)) return;
    const matchId = message.matchId!;

    switch (message.type) {
        case "subscribe":
            subscribeToMatch(matchId, socket);
            subscribedMatchIds.add(matchId);
            break;
        case "unsubscribe":
            unsubscribeFromMatch(matchId, socket);
            subscribedMatchIds.delete(matchId);
            break;
        case "subscribe_commentary":
            subscribeToCommentary(matchId, socket);
            subscribedCommentaryIds.add(matchId);
            break;
        case "unsubscribe_commentary":
            unsubscribeFromCommentary(matchId, socket);
            subscribedCommentaryIds.delete(matchId);
            break;
    }
}

function cleanUpSubscriberMap(map: Map<number, Set<WebSocket>>) {
    for (const [matchId, subscribers] of map.entries()) {
        for (const ws of subscribers) {
            if ((ws as ExtWebSocket).isAlive === false) {
                subscribers.delete(ws);
            }
        }
        if (subscribers.size === 0) {
            map.delete(matchId);
        }
    }
}

function cleanUpSubscriptions() {
    cleanUpSubscriberMap(matchSubscribers);
    cleanUpSubscriberMap(commentarySubscribers);
}

/**
 * Sends a JSON payload to a specific socket safely.
 */
function sendJSON<T extends object>(socket: WebSocket, payload: T) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

/**
 * Attaches the WebSocket server to the provided HTTP server.
 */
export function attachWebSocketServer(server: Server) {
    wss = new WebSocketServer({
        noServer: true,
        maxPayload: 1024 * 1024 // 1MB
    });

    function broadcastMatchCreated(match: any) {
        broadcastToAll({ type: "match_created", data: match });
    }

    server.on("upgrade", async (req, socket, head) => {
        const { pathname } = new URL(req.url || "", `http://${req.headers.host}`);

        if (pathname !== "/ws") {
            socket.destroy();
            return;
        }

        if (wsArcjet) {
            try {
                // Arcjet auto-detects IP when proxies are configured
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    console.log(`[WS Security] Upgrade denied. Reason: ${decision.reason.type}`);
                    socket.end('HTTP/1.1 403 Forbidden\r\n\r\n');
                    return;
                }
            } catch (error) {
                console.error("WS Arcjet upgrade check error:", error);
                socket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
                return;
            }
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit("connection", ws, req);
        });
    });

    wss.on("connection", (ws: WebSocket) => {
        const extWs = ws as ExtWebSocket;
        extWs.isAlive = true;
        console.log("New WebSocket connection established");

        ws.on("pong", () => {
            extWs.isAlive = true;
        });

        sendJSON(ws, { type: "Welcome" });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        // Track per-connection subscriptions for both channels — used for cleanup on close
        const subscribedMatchIds = new Set<number>();
        const subscribedCommentaryIds = new Set<number>();

        ws.on("message", (data) => handleMessage(ws, subscribedMatchIds, subscribedCommentaryIds, data as Buffer));

        ws.on("close", () => {
            for (const matchId of subscribedMatchIds) {
                unsubscribeFromMatch(matchId, ws);
            }
            for (const matchId of subscribedCommentaryIds) {
                unsubscribeFromCommentary(matchId, ws);
            }
            console.log("WebSocket connection closed");
        });
    });

    const interval = setInterval(() => {
        cleanUpSubscriptions();
        wss.clients.forEach((ws) => {
            const extWs = ws as ExtWebSocket;
            if (!extWs.isAlive) {
                ws.terminate();
                return;
            }

            extWs.isAlive = false;
            ws.ping();
        });
    }, 10000);

    wss.on("close", () => {
        clearInterval(interval);
    });

    return { broadcastMatchCreated, broadcastCommentary };
}
