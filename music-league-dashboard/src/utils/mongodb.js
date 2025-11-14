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

