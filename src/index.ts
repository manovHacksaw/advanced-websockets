import { eq } from 'drizzle-orm';
import { db, pool } from './db/db';
import { matches, commentary } from './db/schema';

async function main() {
    try {
        console.log('Performing CRUD operations for Sports App...');

        // CREATE: Insert a new match
        const [newMatch] = await db
            .insert(matches)
            .values({
                sport: 'Soccer',
                homeTeam: 'Team A',
                awayTeam: 'Team B',
                startTime: new Date(),
                status: 'live'
            })
            .returning();

        if (!newMatch) {
            throw new Error('Failed to create match');
        }

        console.log('✅ CREATE: New match created:', newMatch);

        // CREATE: Insert commentary
        const [newCommentary] = await db
            .insert(commentary)
            .values({
                matchId: newMatch.id,
                minute: 10,
                sequence: 1,
                period: '1st Half',
                eventType: 'Goal',
                actor: 'Player 1',
                team: 'Team A',
                message: 'Goal for Team A!'
            })
            .returning();

        console.log('✅ CREATE: New commentary added:', newCommentary);

        // READ: Select the match with its commentary
        const foundMatch = await db.select().from(matches).where(eq(matches.id, newMatch.id));
        console.log('✅ READ: Found match:', foundMatch[0]);

        // UPDATE: Update the score
        const [updatedMatch] = await db
            .update(matches)
            .set({ homeScore: 1 })
            .where(eq(matches.id, newMatch.id))
            .returning();

        console.log('✅ UPDATE: Match score updated:', updatedMatch);

        // DELETE: Clean up (Delete commentary first due to FK)
        await db.delete(commentary).where(eq(commentary.matchId, newMatch.id));
        await db.delete(matches).where(eq(matches.id, newMatch.id));
        console.log('✅ DELETE: Test data deleted.');

        console.log('\nCRUD operations completed successfully.');
    } catch (error) {
        console.error('❌ Error performing CRUD operations:', error);
        // process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
            console.log('Database pool closed.');
        }
    }
}

main();
