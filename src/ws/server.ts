import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../../arcjet";

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
}

/**
 * Sends a JSON payload to a specific socket safely.
 */
function sendJSON<T extends object>(socket: WebSocket, payload: T) {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
}

/**
 * Sends a JSON payload to all connected clients.
 */
export function broadcast<T extends object>(wss: WebSocketServer, payload: T) {
    for (const client of wss.clients) {
        sendJSON(client, payload);
    }
}

/**
 * Attaches the WebSocket server to the provided HTTP server.
 */
export function attachWebSocketServer(server: Server) {
    const wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 1024 * 1024 // 1MB 
    });

    function broadcastMatchCreated(match: any) {
        broadcast(wss, { type: "match_created", data: match });
    }

    wss.on("connection", async (ws: WebSocket, req) => {
        if (wsArcjet) {
            try {
                // Forcefully extract the best guess for the IP address
                const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";

                // Call protect - Arcjet's Node SDK should now find the IP on req.ip
                const decision = await (wsArcjet.protect as any)(req, { ip });
                if (decision.isDenied()) {
                    let code = 1011; // Internal Error
                    let reason = "Access denied";

                    if (decision.reason.isRateLimit()) {
                        code = 1013; // Try Again Later
                        reason = "Too many requests";
                    } else if (decision.reason.isBot()) {
                        code = 1008; // Policy Violation
                        reason = "No bots allowed";
                    } else if (decision.reason.isShield()) {
                        reason = "Suspicious activity detected";
                    }

                    ws.close(code, reason);
                    return;
                }
            } catch (error) {
                console.error("WS Arcjet protection error:", error);
                ws.close(1011, "Internal server error during connection check");
                return;
            }
        }


        const extWs = ws as ExtWebSocket;
        extWs.isAlive = true;

        ws.on("pong", () => {
            extWs.isAlive = true;
        });
        console.log("New WebSocket connection established");

        sendJSON(ws, { type: "Welcome" });

        ws.on("error", (error) => {
            console.error("WebSocket error:", error);
        });

        ws.on("message", (message) => {
            // Echo back for now or handle incoming events
            console.log("Received message:", message.toString());
        });

        ws.on("close", () => {
            console.log("WebSocket connection closed");
        });
    });

    const interval = setInterval(() => {
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

    return { broadcastMatchCreated };
}