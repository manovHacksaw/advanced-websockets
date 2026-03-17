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
    proxies: ["127.0.0.1"], // Configure trusted proxies here
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
    proxies: ["127.0.0.1"], // Configure trusted proxies here
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

export function securityMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
        console.log("Middleware executed!");
        if (!httpArcjet) {
            return next();
        }

        try {
            // Arcjet auto-detects IP when proxies are configured
            const decision = await httpArcjet.protect(req);

            console.log(`[HTTP Security] Decision: ${decision.conclusion} | Reason: ${decision.reason.type}`);

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
