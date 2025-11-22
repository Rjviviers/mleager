import { z } from 'zod';

export const LeagueSchema = z.object({
    _id: z.number(),
    name: z.string(),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
});

export const CompetitorSchema = z.object({
    _id: z.string(),
    name: z.string(),
    leagues: z.array(z.number()),
    createdAt: z.string().or(z.date()).optional(),
    updatedAt: z.string().or(z.date()).optional(),
});

export const RoundSchema = z.object({
    _id: z.string(),
    leagueId: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    playlistUrl: z.string().optional(),
    created: z.string().or(z.date()).optional(),
    updated: z.string().or(z.date()).optional(),
});

export const SubmissionSchema = z.object({
    _id: z.any(), // Handle ObjectId
    roundId: z.string(),
    spotifyUri: z.string(),
    submitterId: z.string(),
    comment: z.string().optional(),
    title: z.string().optional(),
    artists: z.array(z.string()).optional(),
    album: z.string().optional(),
    albumArt: z.string().optional(),
    metadata: z.any().optional(), // Placeholder for populated metadata
});

export const VoteSchema = z.object({
    _id: z.any().optional(), // Handle ObjectId
    roundId: z.string(),
    voterId: z.string(),
    spotifyUri: z.string(),
    pointsAssigned: z.number(),
    comment: z.string().optional(),
});

export const SongMetadataSchema = z.object({
    spotifyUri: z.string(),
    name: z.string(),
    artists: z.array(z.any()).optional(), // Array of objects
    album: z.any().optional(), // Object
    albumArt: z.string().optional(),
    preview_url: z.string().nullable().optional(),
    popularity: z.number().optional(),
    duration_ms: z.number().optional(),
    explicit: z.boolean().optional(),
    genres: z.array(z.string()).optional(),
    energy: z.number().optional(),
    danceability: z.number().optional(),
    valence: z.number().optional(),
    acousticness: z.number().optional(),
    tempo: z.number().optional(),
    loudness: z.number().optional(),
    spotify_url: z.string().optional(),
});

// API Response Schemas
export const LeagueResponseSchema = z.array(LeagueSchema);
export const CompetitorResponseSchema = z.array(CompetitorSchema);
export const RoundResponseSchema = z.array(RoundSchema);
export const SubmissionResponseSchema = z.array(SubmissionSchema);
export const VoteResponseSchema = z.array(VoteSchema);
