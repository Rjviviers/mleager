import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { seedDatabase } from './scripts/seed-db.js';
import {
    getLeagues,
    getCompetitorsByLeague,
    getRoundsByLeague,
    getSubmissionsByRound,
    getVotesByRound,
    getSongMetadata
} from './src/utils/mongodb.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

app.use(cors());
app.use(express.json());

// Database connection middleware
app.use(async (req, res, next) => {
    try {
        // In a real app, we'd use the connection pooling from mongodb.js
        // For now, we'll rely on the utility functions which handle their own connections
        // or we could initialize a global connection here.
        next();
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ error: 'Database connection error' });
    }
});

// API Endpoints

// Get all data (mimics the loadAllData structure)
app.get('/api/data', async (req, res) => {
    try {
        console.log('Fetching all data...');

        // We need to reconstruct the data structure expected by the frontend
        // This is a bit inefficient as it fetches everything, but it matches the current frontend logic

        // 1. Fetch Leagues
        const leagues = await getLeagues();

        // 2. Fetch Data for each League
        const leagueData = {};
        const allMetadata = new Map();

        for (const league of leagues) {
            const leagueId = league._id;
            const leagueKey = league.name.toLowerCase().replace(' ', ''); // e.g., "league1"

            const [competitors, rounds] = await Promise.all([
                getCompetitorsByLeague(leagueId),
                getRoundsByLeague(leagueId)
            ]);

            // Fetch submissions and votes for all rounds
            const submissions = [];
            const votes = [];

            for (const round of rounds) {
                const roundSubmissions = await getSubmissionsByRound(round._id);
                const roundVotes = await getVotesByRound(round._id);

                submissions.push(...roundSubmissions);
                votes.push(...roundVotes);
            }

            // Enrich submissions with metadata
            // We need to fetch metadata for all songs
            // Optimization: Fetch all metadata once or in batches. 
            // For now, let's fetch metadata for each submission if not already fetched.

            const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
                let metadata = allMetadata.get(sub.spotifyUri);
                if (!metadata) {
                    metadata = await getSongMetadata(sub.spotifyUri);
                    if (metadata) {
                        allMetadata.set(sub.spotifyUri, metadata);
                    }
                }
                return {
                    ...sub,
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
            metadata: Object.fromEntries(allMetadata) // Convert Map to Object for JSON
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});

// New granular API endpoints
// Get all leagues
app.get('/api/leagues', async (req, res) => {
    try {
        const leagues = await getLeagues();
        res.json(leagues);
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
        res.json(competitors);
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
        res.json(rounds);
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
        res.json(submissions);
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
        res.json(votes);
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({ error: 'Failed to fetch votes' });
    }
});

// Get metadata for a song
app.get('/api/metadata/:spotifyUri', async (req, res) => {
    try {
        const spotifyUri = decodeURIComponent(req.params.spotifyUri);
        const metadata = await getSongMetadata(spotifyUri);
        res.json(metadata);
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({ error: 'Failed to fetch metadata' });
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
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;
