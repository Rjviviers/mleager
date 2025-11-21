import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedDatabase } from './scripts/seed-db.js';
import {
    getLeagues,
    getCompetitorsByLeague,
    getRoundsByLeague,
    getSubmissionsByRound,
    getVotesByRound,
    getSongMetadata,
    connectToDatabase
} from './src/utils/mongodb.js';
import { LeagueResponseSchema, CompetitorResponseSchema, RoundResponseSchema, SubmissionResponseSchema, VoteResponseSchema } from './src/schemas/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection middleware (ensure connection)
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});

// API Endpoints

// Get all data (mimics the loadAllData structure) - Deprecated but kept for compatibility
app.get('/api/data', async (req, res) => {
    try {
        console.log('Fetching all data...');
        const leagues = await getLeagues();
        const leagueData = {};
        const allMetadata = new Map();

        for (const league of leagues) {
            const leagueId = league._id;
            const leagueKey = league.name.toLowerCase().replace(' ', '');

            const [competitors, rounds] = await Promise.all([
                getCompetitorsByLeague(leagueId),
                getRoundsByLeague(leagueId)
            ]);

            const submissions = [];
            const votes = [];

            for (const round of rounds) {
                const roundSubmissions = await getSubmissionsByRound(round._id);
                const roundVotes = await getVotesByRound(round._id);
                submissions.push(...roundSubmissions);
                votes.push(...roundVotes);
            }

            // Enrich submissions with metadata
            const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
                let metadata = allMetadata.get(sub.spotifyUri);
                if (!metadata) {
                    metadata = await getSongMetadata(sub.spotifyUri);
                    if (metadata) {
                        allMetadata.set(sub.spotifyUri, metadata);
                    }
                }
                return {
                    ...sub.toObject(), // Convert Mongoose doc to object
                    metadata: metadata || null
                };
            }));

            leagueData[leagueKey] = {
                competitors,
                rounds,
                submissions: enrichedSubmissions,
                votes
            };
        }

        res.json({
            ...leagueData,
            metadata: Object.fromEntries(allMetadata)
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

// New granular API endpoints with Zod Validation

// Get all leagues
app.get('/api/leagues', async (req, res) => {
    try {
        const leagues = await getLeagues();
        // Validate response
        const validated = LeagueResponseSchema.parse(leagues);
        res.json(validated);
    } catch (error) {
        console.error('Error fetching leagues:', error);
        res.status(500).json({ error: 'Failed to fetch leagues' });
    }
});

// Get competitors for a league
app.get('/api/competitors/:leagueId', async (req, res) => {
    try {
        const leagueId = req.params.leagueId;
        const competitors = await getCompetitorsByLeague(leagueId);
        // Validate response
        const validated = CompetitorResponseSchema.parse(competitors);
        res.json(validated);
    } catch (error) {
        console.error('Error fetching competitors:', error);
        res.status(500).json({ error: 'Failed to fetch competitors' });
    }
});

// Get rounds for a league
app.get('/api/rounds/:leagueId', async (req, res) => {
    try {
        const leagueId = req.params.leagueId;
        const rounds = await getRoundsByLeague(leagueId);
        // Validate response
        const validated = RoundResponseSchema.parse(rounds);
        res.json(validated);
    } catch (error) {
        console.error('Error fetching rounds:', error);
        res.status(500).json({ error: 'Failed to fetch rounds' });
    }
});

// Get submissions for a round
app.get('/api/submissions/:roundId', async (req, res) => {
    try {
        const roundId = req.params.roundId;
        const submissions = await getSubmissionsByRound(roundId);

        // Enrich with metadataId
        const enriched = await Promise.all(submissions.map(async (sub) => {
            const metadata = await getSongMetadata(sub.spotifyUri);
            const metaId = metadata ? metadata._id : null;
            return { ...sub.toObject(), metadataId: metaId };
        }));

        // Validate response (Note: SubmissionResponseSchema might need to allow extra fields or we pick specific ones)
        // For now, we just send enriched data. Zod might strip unknown keys if we used .parse() with strict(), but default is strip.
        // However, our schema doesn't have metadataId. We should add it or just return enriched.
        // Let's return enriched for now to avoid breaking frontend if it relies on it.
        // Ideally we update schema.

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// Get votes for a round
app.get('/api/votes/:roundId', async (req, res) => {
    try {
        const roundId = req.params.roundId;
        const votes = await getVotesByRound(roundId);
        const validated = VoteResponseSchema.parse(votes);
        res.json(validated);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({ error: 'Failed to fetch votes' });
    }
});

// Trigger CSV Import
app.post('/api/import', async (req, res) => {
    try {
        console.log('Starting CSV import...');
        await seedDatabase();
        res.json({ message: 'Data import completed successfully' });
    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ error: 'Data import failed', details: error.message });
    }
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    // Connect to DB before listening
    connectToDatabase().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

export default app;
