import { Router, Request } from "express";
import { db } from "../db/db";
import { commentary } from "../db/schema";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary";
import { matchIdParamSchema } from "../validation/matches";
import { eq, desc } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req: Request<{ matchId: string }>, res) => {
    const paramsResult = matchIdParamSchema.safeParse({ id: req.params.matchId });
    if (!paramsResult.success) {
        res.status(400).json({ error: "Invalid match parameters", details: paramsResult.error.issues });
        return;
    }

    const { id: matchId } = paramsResult.data;

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        res.status(400).json({ error: "Invalid query parameters", details: queryResult.error.issues });
        return;
    }

    const { limit = 50 } = queryResult.data;

    try {
        const results = await db.select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data: results });
    } catch (error: any) {
        console.error("Error fetching commentary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

commentaryRouter.post('/', async (req: Request<{ matchId: string }>, res) => {
    const paramsResult = matchIdParamSchema.safeParse({ id: req.params.matchId });
    if (!paramsResult.success) {
        res.status(400).json({ error: "Invalid match parameters", details: paramsResult.error.issues });
        return;
    }

    const { id: matchId } = paramsResult.data;

    const bodyResult = createCommentarySchema.safeParse(req.body);
    if (!bodyResult.success) {
        res.status(400).json({ error: "Validation failed", details: bodyResult.error.issues });
        return;
    }

    const validatedBody = bodyResult.data;

    try {
        const result = await db.insert(commentary).values({
            matchId,
            minute: validatedBody.minutes,
            sequence: validatedBody.sequence,
            period: validatedBody.period,
            eventType: validatedBody.eventType,
            actor: validatedBody.actor,
            team: validatedBody.team,
            message: validatedBody.message,
            metadata: validatedBody.metadata,
            tags: validatedBody.tags,
        }).returning();

        if (res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(matchId, { type: "commentary", matchId, data: result[0] });
        }

        res.status(201).json(result[0]);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: "Validation failed", details: error.issues });
            return;
        }
        console.error("Error creating commentary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});