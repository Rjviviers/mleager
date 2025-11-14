// MongoDB connection utility
// This can be used in a backend/API service

import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URL);
  await client.connect();

  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Example query functions
export async function getLeagues() {
  const collection = await getCollection('leagues');
  return collection.find({}).toArray();
}

export async function getCompetitorsByLeague(leagueId) {
  const collection = await getCollection('competitors');
  return collection.find({ leagues: parseInt(leagueId) }).toArray();
}

export async function getRoundsByLeague(leagueId) {
  const collection = await getCollection('rounds');
  return collection.find({ leagueId: parseInt(leagueId) })
    .sort({ created: -1 })
    .toArray();
}

export async function getSubmissionsByRound(roundId) {
  const collection = await getCollection('submissions');
  return collection.find({ roundId }).toArray();
}

export async function getVotesByRound(roundId) {
  const collection = await getCollection('votes');
  return collection.find({ roundId }).toArray();
}

export async function getTopSubmissionsByRound(roundId) {
  const collection = await getCollection('votes');
  return collection.aggregate([
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
  ]).toArray();
}

export async function getCompetitorStats(competitorId, leagueId) {
  const votes = await getCollection('votes');
  const submissions = await getCollection('submissions');

  // Get submissions by this competitor
  const competitorSubmissions = await submissions.find({
    submitterId: competitorId,
    leagueId: parseInt(leagueId)
  }).toArray();

  // Get votes for their submissions
  const spotifyUris = competitorSubmissions.map(s => s.spotifyUri);
  const votesReceived = await votes.find({
    spotifyUri: { $in: spotifyUris },
    leagueId: parseInt(leagueId)
  }).toArray();

  // Get votes given by this competitor
  const votesGiven = await votes.find({
    voterId: competitorId,
    leagueId: parseInt(leagueId)
  }).toArray();

  const totalPointsReceived = votesReceived.reduce((sum, vote) => sum + vote.pointsAssigned, 0);
  const totalPointsGiven = votesGiven.reduce((sum, vote) => sum + vote.pointsAssigned, 0);

  return {
    competitorId,
    totalSubmissions: competitorSubmissions.length,
    totalVotesReceived: votesReceived.length,
    totalPointsReceived,
    totalVotesGiven: votesGiven.length,
    totalPointsGiven,
    submissions: competitorSubmissions
  };
}

// Song Metadata Functions

export async function getSongMetadata(spotifyUri) {
  const collection = await getCollection('song_metadata');
  return collection.findOne({ spotifyUri });
}

export async function getSongsWithMetadata(leagueId) {
  const submissions = await getCollection('submissions');
  const metadata = await getCollection('song_metadata');

  const pipeline = [
    { $match: { leagueId: parseInt(leagueId) } },
    {
      $lookup: {
        from: 'song_metadata',
        localField: 'spotifyUri',
        foreignField: 'spotifyUri',
        as: 'metadata'
      }
    },
    { $unwind: { path: '$metadata', preserveNullAndEmptyArrays: true } }
  ];

  return submissions.aggregate(pipeline).toArray();
}

export async function getAudioFeaturesAnalytics(leagueId) {
  const votes = await getCollection('votes');
  const submissions = await getCollection('submissions');
  const metadata = await getCollection('song_metadata');

  // Aggregate votes by song with metadata
  const pipeline = [
    { $match: { leagueId: parseInt(leagueId) } },
    {
      $group: {
        _id: '$spotifyUri',
        totalVotes: { $sum: '$pointsAssigned' },
        voteCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'submissions',
        localField: '_id',
        foreignField: 'spotifyUri',
        as: 'submission'
      }
    },
    { $unwind: '$submission' },
    {
      $lookup: {
        from: 'song_metadata',
        localField: '_id',
        foreignField: 'spotifyUri',
        as: 'metadata'
      }
    },
    { $unwind: { path: '$metadata', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        spotifyUri: '$_id',
        title: '$submission.title',
        artist: '$submission.artists',
        totalVotes: 1,
        voteCount: 1,
        energy: '$metadata.energy',
        danceability: '$metadata.danceability',
        valence: '$metadata.valence',
        acousticness: '$metadata.acousticness',
        tempo: '$metadata.tempo',
        loudness: '$metadata.loudness'
      }
    },
    { $sort: { totalVotes: -1 } }
  ];

  return votes.aggregate(pipeline).toArray();
}

// Genre Functions

export async function getAllGenres() {
  const collection = await getCollection('genres');
  return collection.find({}).sort({ artistCount: -1 }).toArray();
}

export async function getGenreByName(genreName) {
  const collection = await getCollection('genres');
  return collection.findOne({ name: genreName });
}

export async function getSongsByGenre(genreName, leagueId = null) {
  const metadata = await getCollection('song_metadata');
  const query = { genre: genreName };

  if (leagueId) {
    // Join with submissions to filter by league
    const submissions = await getCollection('submissions');
    const pipeline = [
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
    ];
    return submissions.aggregate(pipeline).toArray();
  }

  return metadata.find(query).toArray();
}

export async function getGenreDistribution(leagueId = null) {
  if (leagueId) {
    // Get genre distribution for a specific league
    const submissions = await getCollection('submissions');
    const pipeline = [
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
    ];
    return submissions.aggregate(pipeline).toArray();
  }

  // Get overall genre distribution from song_metadata
  const metadata = await getCollection('song_metadata');
  const pipeline = [
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
  ];
  return metadata.aggregate(pipeline).toArray();
}

export async function getGenresByCompetitor(competitorId, leagueId) {
  const submissions = await getCollection('submissions');
  const pipeline = [
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
  ];
  return submissions.aggregate(pipeline).toArray();
}

