import { z } from 'zod';

export const listCommentaryQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const commentarySchema = z.object({
    minutes: z.number().int().nonnegative(),
    sequence: z.number().int().nonnegative().optional(),
    period: z.string().trim().min(1).optional(),
    eventType: z.string().trim().min(1).optional(),
    actor: z.string().trim().min(1).optional(),
    team: z.string().trim().min(1).optional(),
    message: z.string().trim().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
});

export const matchIdParams = z.object({
    matchId: z.coerce.number().int().positive(),
});

export const createCommentarySchema = commentarySchema.extend({
    sequence: z.number().int().nonnegative().default(0),
    eventType: z.string().trim().min(1),
});

export type ListCommentaryQuery = z.infer<typeof listCommentaryQuerySchema>;
export type CommentaryInput = z.infer<typeof commentarySchema>;
export type MatchIdParams = z.infer<typeof matchIdParams>;
export type CreateCommentaryInput = z.infer<typeof createCommentarySchema>;
