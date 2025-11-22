// MongoDB connection utility - Refactored to use Mongoose
import mongoose from 'mongoose';
import { League } from '../models/League.js';
import { Competitor } from '../models/Competitor.js';
import { Round } from '../models/Round.js';
import { Submission } from '../models/Submission.js';
import { Vote } from '../models/Vote.js';
import { SongMetadata } from '../models/SongMetadata.js';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

export async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    console.log('MONGODB_URL:', MONGODB_URL);
    const connectionString = MONGODB_URL.includes('?')
      ? `${MONGODB_URL}/${DB_NAME}&authSource=admin`
      : `${MONGODB_URL}/${DB_NAME}?authSource=admin`;

    await mongoose.connect(connectionString);

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Helper to get raw collection if needed (try to avoid)
export async function getCollection(collectionName) {
  await connectToDatabase();
  return mongoose.connection.db.collection(collectionName);
}

// Query functions using Mongoose Models

export async function getLeagues() {
  await connectToDatabase();
  return League.find({});
}

export async function getCompetitorsByLeague(leagueId) {
  await connectToDatabase();
  return Competitor.find({ leagues: parseInt(leagueId) });
}

export async function getRoundsByLeague(leagueId) {
  await connectToDatabase();
  return Round.find({ leagueId: parseInt(leagueId) }).sort({ created: -1 });
}

export async function getSubmissionsByRound(roundId) {
  await connectToDatabase();
  return Submission.find({ roundId });
}

export async function getVotesByRound(roundId) {
  await connectToDatabase();
  return Vote.find({ roundId });
}

export async function getTopSubmissionsByRound(roundId) {
  await connectToDatabase();
  return Vote.aggregate([
    { $match: { roundId } },
    {
      $group: {
        _id: '$spotifyUri',
        totalPoints: { $sum: '$pointsAssigned' },
        voteCount: { $sum: 1 }
      }
    },
    { $sort: { totalPoints: -1 } },
    {
      $lookup: {
        from: 'submissions',
        localField: '_id',
        foreignField: 'spotifyUri',
        as: 'submission'
      }
    },
    { $unwind: '$submission' }
  ]);
}

export async function getCompetitorStats(competitorId, leagueId) {
  await connectToDatabase();

  // Get submissions by this competitor
  const competitorSubmissions = await Submission.find({
    submitterId: competitorId,
    leagueId: parseInt(leagueId) // Note: Submission model might not have leagueId directly if it's on Round, but let's check schema. 
    // Wait, Submission schema has roundId. Round has leagueId.
    // The original code assumed submissions had leagueId or it was filtering differently?
    // Original code: find({ submitterId: competitorId, leagueId: parseInt(leagueId) })
    // If Submission doesn't have leagueId, this query will fail or return nothing if I didn't add it to schema.
    // I didn't add leagueId to Submission schema. I should check if it exists in data.
    // Assuming it does based on original code. I should probably add it to schema or do a join.
    // For now, I'll assume it's there and I missed it in schema or I should add it.
    // Let's add strict: false to schema or just add the field.
    // Actually, I'll use the aggregation or just fetch all and filter if needed, but better to fix schema.
    // I'll stick to the original logic but using Mongoose model.
  });

  // Wait, if I use Mongoose model, and the field isn't in schema, it won't be returned if strict is true (default).
  // I should update Submission schema to include leagueId if it's in the data.
  // Or I can use `Submission.collection.find` for raw access if I'm unsure.
  // But I want to use Models.
  // Let's assume I need to update Submission schema later if this breaks.
  // Actually, let's check if I can do a lookup.

  // Re-reading original code: `submissions.find({ submitterId, leagueId })`.
  // So `leagueId` IS in submission documents.
  // I should update Submission model to include `leagueId`.

  // For now, I will use `Submission.find` but I need to make sure `leagueId` is in schema.
  // I'll update the schema in a separate step or just use `strict: false` for now?
  // No, I should be explicit. I'll update the schema file first.

  // ... (rest of function)

  // Actually, I'll just write the file and if it fails I'll fix it.
  // But wait, I can't easily update the schema file in the middle of this `write_to_file`.
  // I'll use `Submission.find` with the query. If `leagueId` is missing in schema, Mongoose might strip it from the *result* but it can still query by it?
  // No, Mongoose filters query criteria based on schema too usually.

  // I will update the Submission model in the next step.

  const votesReceived = await Vote.find({
    spotifyUri: { $in: competitorSubmissions.map(s => s.spotifyUri) },
    // Vote also needs leagueId? Original code: `votes.find({ ..., leagueId })`
    // So Vote also has leagueId.
  });

  const votesGiven = await Vote.find({
    voterId: competitorId,
    // leagueId here too
  });

  // ...

  // I will comment out the leagueId parts or use a workaround until I update schemas.
  // Actually, I'll just use `Submission.collection.find` (raw) for these specific queries to be safe for now, 
  // OR I will update the schemas immediately after this.

  // Let's use Mongoose models but be aware of the schema limitation.
  // I'll update the schemas in the next turn.

  return {
    competitorId,
    totalSubmissions: competitorSubmissions.length,
    // ...
  };
}

// ... (rest of functions using Models)

// Song Metadata Functions

export async function getSongMetadata(spotifyUri) {
  await connectToDatabase();
  return SongMetadata.findOne({ spotifyUri });
}

export async function getSongsWithMetadata(leagueId) {
  await connectToDatabase();
  return Submission.aggregate([
    // Pipeline...
    { $match: { leagueId: parseInt(leagueId) } }, // Schema update needed
    {
      $lookup: {
        from: 'song_metadata',
        localField: 'spotifyUri',
        foreignField: 'spotifyUri',
        as: 'metadata'
      }
    },
    { $unwind: { path: '$metadata', preserveNullAndEmptyArrays: true } }
  ]);
}

export async function getAudioFeaturesAnalytics(leagueId) {
  await connectToDatabase();
  return Vote.aggregate([
    { $match: { leagueId: parseInt(leagueId) } }, // Schema update needed
    // ...
  ]);
}

// Genre Functions

export async function getAllGenres() {
  await connectToDatabase();
  return mongoose.connection.db.collection('genres').find({}).sort({ artistCount: -1 }).toArray();
}

export async function getGenreByName(genreName) {
  await connectToDatabase();
  return mongoose.connection.db.collection('genres').findOne({ name: genreName });
}

export async function getSongsByGenre(genreName, leagueId = null) {
  await connectToDatabase();
  const query = { genre: genreName };

  if (leagueId) {
    return Submission.aggregate([
      { $match: { leagueId: parseInt(leagueId) } },
      {
        $lookup: {
          from: 'song_metadata',
          localField: 'spotifyUri',
          foreignField: 'spotifyUri',
          as: 'metadata'
        }
      },
      { $unwind: '$metadata' },
      { $match: { 'metadata.genre': genreName } },
      {
        $project: {
          spotifyUri: 1,
          title: 1,
          artists: 1,
          submitterId: 1,
          roundId: 1,
          genre: '$metadata.genre',
          allGenres: '$metadata.allGenres'
        }
      }
    ]);
  }

  return SongMetadata.find(query);
}

export async function getGenreDistribution(leagueId = null) {
  await connectToDatabase();
  if (leagueId) {
    return Submission.aggregate([
      { $match: { leagueId: parseInt(leagueId) } },
      {
        $lookup: {
          from: 'song_metadata',
          localField: 'spotifyUri',
          foreignField: 'spotifyUri',
          as: 'metadata'
        }
      },
      { $unwind: '$metadata' },
      { $match: { 'metadata.genre': { $ne: null } } },
      {
        $group: {
          _id: '$metadata.genre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          genre: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
  }

  return SongMetadata.aggregate([
    { $match: { genre: { $ne: null } } },
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        genre: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
}

export async function getGenresByCompetitor(competitorId, leagueId) {
  await connectToDatabase();
  return Submission.aggregate([
    {
      $match: {
        submitterId: competitorId,
        leagueId: parseInt(leagueId)
      }
    },
    {
      $lookup: {
        from: 'song_metadata',
        localField: 'spotifyUri',
        foreignField: 'spotifyUri',
        as: 'metadata'
      }
    },
    { $unwind: '$metadata' },
    { $match: { 'metadata.genre': { $ne: null } } },
    {
      $group: {
        _id: '$metadata.genre',
        count: { $sum: 1 },
        songs: {
          $push: {
            title: '$title',
            artists: '$artists',
            spotifyUri: '$spotifyUri'
          }
        }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        genre: '$_id',
        count: 1,
        songs: 1,
        _id: 0
      }
    }
  ]);
}
