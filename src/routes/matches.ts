import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches";
import { db } from "../db/db";
import { matches } from "../db/schema";
import { getMatchStatus } from "../utils/matchStatus";
import { eq, and, desc } from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query", data: JSON.stringify(parsed.error) })
    }

    const { sport, status, limit = MAX_LIMIT, offset = 0 } = parsed.data;

    try {
        const data = await db.select().from(matches)
            .where(and(
                sport ? eq(matches.sport, sport) : undefined,
                status ? eq(matches.status, status) : undefined,
            ))
            .orderBy(desc(matches.createdAt))
            .limit(limit)
            .offset(offset);

        res.json({ data });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" })
    }
});


matchRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", data: JSON.stringify(parsed.error) });
    }

    const { startTime, endTime, homeScore, awayScore, ...rest } = parsed.data;

    try {
        const [event] = await db.insert(matches).values({
            ...rest,
            startTime: new Date(startTime),
            endTime: endTime ? new Date(endTime) : undefined,
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime) ?? 'scheduled',

        }).returning();

        res.status(201).json({ data: event })
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }

})