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
        noServer: true,
        maxPayload: 1024 * 1024 // 1MB 
    });

    function broadcastMatchCreated(match: any) {
        broadcast(wss, { type: "match_created", data: match });
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