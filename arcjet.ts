import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) {
    throw new Error("ARCJET_KEY must be set in environment variables");
}

/**
 * Arcjet client configured for the application.
 * Using @arcjet/node because the server uses Express.
 */
const httpArcjet = arcjet({
    key: arcjetKey,
    rules: [
        // Shield protects against common attacks like SQL injection, XSS, etc.
        shield({ mode: arcjetMode }),
        // detectBot helps identify and block malicious bots while allowing search engines
        detectBot({
            mode: arcjetMode,
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Allow Google, Bing, etc.
                "CATEGORY:PREVIEW"        // Allow Link previews (Slack, Discord)
            ]
        }),
        slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })

    ]
});

const wsArcjet = arcjet({
    key: arcjetKey,
    rules: [
        // Shield protects against common attacks like SQL injection, XSS, etc.
        shield({ mode: arcjetMode }),
        // detectBot helps identify and block malicious bots while allowing search engines
        detectBot({
            mode: arcjetMode,
            allow: [
                "CATEGORY:SEARCH_ENGINE", // Allow Google, Bing, etc.
                "CATEGORY:PREVIEW"        // Allow Link previews (Slack, Discord)
            ]
        }),
        slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })

    ]
});

import { Request, Response, NextFunction } from "express";

/**
 * Creates an Express middleware that enforces Arcjet security decisions for incoming HTTP requests.
 *
 * The middleware extracts the client IP, invokes Arcjet protection for the request, and either calls `next()`
 * or responds with an HTTP error based on Arcjet's decision.
 *
 * @returns An Express middleware function that inspects requests and either calls `next()` or sends an HTTP error response:
 * - `429` with `{ error: "Too many requests" }` when rate limited
 * - `403` with `{ error: "No bots allowed" }` when classified as a bot
 * - `403` with `{ error: "Suspicious activity detected" }` when blocked by the shield
 * - `403` with `{ error: "Access denied" }` for other denials
 */
export function securityMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
        console.log("Middleware executed!");
        if (!httpArcjet) {
            return next();
        }

        try {
            // Forcefully extract the best guess for the IP address
            const ip = (req.headers["x-forwarded-for"] as string) || req.ip || req.socket.remoteAddress || "127.0.0.1";

            // Pass the IP to Arcjet explicitly and cast to any to fix lint
            const decision = await (httpArcjet.protect as any)(req, { ip });

            console.log(`[HTTP Security] IP: ${ip} | Decision: ${decision.conclusion} | Reason: ${decision.reason.type}`);

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: "Too many requests" });
                }
                if (decision.reason.isBot()) {
                    return res.status(403).json({ error: "No bots allowed" });
                }
                if (decision.reason.isShield()) {
                    return res.status(403).json({ error: "Suspicious activity detected" });
                }
                return res.status(403).json({ error: "Access denied" });
            }

            next();
        } catch (error) {
            console.error("Arcjet protection error occured:", error);
            return next();
        }
    };
}

export { httpArcjet, wsArcjet };
