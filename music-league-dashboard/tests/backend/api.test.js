import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';

// Mock the database interactions
vi.mock('../../src/utils/mongodb.js', () => ({
    getLeagues: vi.fn().mockResolvedValue([{ _id: 1, name: 'League 1' }]),
    getCompetitorsByLeague: vi.fn().mockResolvedValue([]),
    getRoundsByLeague: vi.fn().mockResolvedValue([]),
    getSubmissionsByRound: vi.fn().mockResolvedValue([]),
    getVotesByRound: vi.fn().mockResolvedValue([]),
    getSongMetadata: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../scripts/seed-db.js', () => ({
    seedDatabase: vi.fn().mockResolvedValue(true),
}));

describe('Backend API', () => {
    it('GET /api/data should return structured data', async () => {
        const res = await request(app).get('/api/data');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('league1');
        expect(res.body.league1).toHaveProperty('competitors');
        expect(res.body.league1).toHaveProperty('rounds');
    });

    it('POST /api/import should trigger seeding', async () => {
        const res = await request(app).post('/api/import');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Data import completed successfully');
    });
});
