import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

// Mock Mongoose Models
const mocks = vi.hoisted(() => ({
    league: {
        find: vi.fn().mockReturnThis(),
        findById: vi.fn(),
        sort: vi.fn(),
    },
    round: {
        find: vi.fn().mockReturnThis(),
        findById: vi.fn(),
        findOne: vi.fn(),
        countDocuments: vi.fn(),
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        populate: vi.fn(),
    },
    submission: {
        find: vi.fn(),
        aggregate: vi.fn(),
        countDocuments: vi.fn(),
    },
    vote: {
        find: vi.fn(),
        countDocuments: vi.fn(),
    },
    competitor: {
        find: vi.fn(),
        countDocuments: vi.fn(),
    },
    songMetadata: {
        findOne: vi.fn(),
    },
    seed: {
        seedDatabase: vi.fn().mockResolvedValue(true),
    }
}));

vi.mock('../../src/models/League.js', () => ({ League: mocks.league }));
vi.mock('../../src/models/Round.js', () => ({ Round: mocks.round }));
vi.mock('../../src/models/Submission.js', () => ({ Submission: mocks.submission }));
vi.mock('../../src/models/Vote.js', () => ({ Vote: mocks.vote }));
vi.mock('../../src/models/Competitor.js', () => ({ Competitor: mocks.competitor }));
vi.mock('../../src/models/SongMetadata.js', () => ({ SongMetadata: mocks.songMetadata }));
vi.mock('../../scripts/seed-db.js', () => ({ seedDatabase: mocks.seed.seedDatabase }));

// Mock DB connection to avoid actual connection
vi.mock('../../src/utils/mongodb.js', () => ({
    connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe('Backend API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/leagues', () => {
        it('should return all leagues', async () => {
            const leagues = [{ _id: '1', name: 'League 1' }];
            mocks.league.find.mockReturnValue({
                sort: vi.fn().mockResolvedValue(leagues)
            });

            const res = await request(app).get('/api/leagues');
            expect(res.status).toBe(200);
            expect(res.body).toEqual(leagues);
        });
    });

    describe('GET /api/stats/overview', () => {
        it('should return overview stats', async () => {
            mocks.submission.countDocuments.mockResolvedValue(100);
            mocks.vote.countDocuments.mockResolvedValue(500);
            mocks.round.countDocuments.mockResolvedValue(10);
            mocks.competitor.countDocuments.mockResolvedValue(20);
            mocks.league.find.mockReturnValue({
                sort: vi.fn().mockResolvedValue([{
                    _id: '1',
                    name: 'L1',
                    toObject: () => ({ _id: '1', name: 'L1' })
                }])
            });
            mocks.submission.aggregate.mockResolvedValue([{ _id: '1', count: 50 }]); // for league stats
            mocks.round.find.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([])
                })
            });

            const res = await request(app).get('/api/stats/overview');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('totalSubmissions', 100);
            expect(res.body).toHaveProperty('totalVotes', 500);
            expect(res.body).toHaveProperty('totalRounds', 10);
        });
    });

    describe('GET /api/songs', () => {
        it('should return aggregated songs', async () => {
            const songs = [{ title: 'Song 1', totalVotes: 10, voteCount: 2, artist: ['Artist 1'], created: new Date(), genres: ['Pop'], album: 'Album 1' }];
            mocks.submission.aggregate.mockResolvedValue(songs);

            const res = await request(app).get('/api/songs');
            expect(res.status).toBe(200);
            expect(res.body[0]).toHaveProperty('title', 'Song 1');
            expect(res.body[0]).toHaveProperty('avgVotes', '5.0');
            expect(res.body[0]).toHaveProperty('created');
            expect(res.body[0]).toHaveProperty('genres');
            expect(Array.isArray(res.body[0].genres)).toBe(true);
            expect(res.body[0]).toHaveProperty('album');
        });
    });

    describe('GET /api/leagues/:leagueId', () => {
        it('should return league details', async () => {
            const league = { _id: 1, name: 'League 1', toObject: () => ({ _id: 1, name: 'League 1' }) };
            mocks.league.findById.mockResolvedValue(league);
            mocks.round.find.mockReturnValue({
                sort: vi.fn().mockResolvedValue([{ _id: 'r1', name: 'Round 1' }])
            });
            mocks.competitor.find.mockResolvedValue([{ _id: 'c1', name: 'Competitor 1' }]);

            const res = await request(app).get('/api/leagues/1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('league');
            expect(res.body.league).toHaveProperty('name', 'League 1');
            expect(res.body).toHaveProperty('rounds');
            expect(res.body).toHaveProperty('competitors');
        });

        it('should return 404 if league not found', async () => {
            mocks.league.findById.mockResolvedValue(null);
            const res = await request(app).get('/api/leagues/999');
            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/rounds/:roundId', () => {
        it('should return round details', async () => {
            const round = { _id: 'r1', name: 'Round 1' };
            mocks.round.findOne.mockResolvedValue(round);
            mocks.submission.find.mockResolvedValue([{ spotifyUri: 'uri1', toObject: () => ({ spotifyUri: 'uri1' }) }]);
            mocks.vote.find.mockResolvedValue([]);
            mocks.songMetadata.findOne.mockResolvedValue({ title: 'Song 1' });

            const res = await request(app).get('/api/rounds/r1');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('round');
            expect(res.body.round).toHaveProperty('name', 'Round 1');
            expect(res.body).toHaveProperty('submissions');
            expect(res.body.submissions[0]).toHaveProperty('metadata');
        });

        it('should return 404 if round not found', async () => {
            mocks.round.findOne.mockResolvedValue(null);
            const res = await request(app).get('/api/rounds/unknown');
            expect(res.status).toBe(404);
        });
    });
});
