import { z } from 'zod';

/**
 * Constants for Match Status
 */
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
} as const;

/**
 * Schema for listing matches query parameters
 */
export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    sport: z.string().trim().min(1).optional(),
    status: z.enum(['scheduled', 'live', 'finished']).optional(),
});

/**
 * Schema for match ID path parameter
 */
export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive(),
});

/**
 * Base schema for score fields
 */
const scoreSchema = z.coerce.number().int().nonnegative();

/**
 * Schema for creating a new match
 */
export const createMatchSchema = z.object({
    sport: z.string().trim().min(1),
    homeTeam: z.string().trim().min(1),
    awayTeam: z.string().trim().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
    homeScore: scoreSchema.optional(),
    awayScore: scoreSchema.optional(),
}).superRefine((data, ctx) => {
    if (data.endTime && new Date(data.endTime) <= new Date(data.startTime)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End time must be after start time",
            path: ["endTime"],
        });
    }
});

/**
 * Schema for updating match scores
 */
export const updateScoreSchema = z.object({
    homeScore: scoreSchema,
    awayScore: scoreSchema,
});

// Export types derived from schemas
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateScoreInput = z.infer<typeof updateScoreSchema>;
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;
