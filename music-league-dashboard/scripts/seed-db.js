import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { spotifyClient } from '../src/utils/spotify.js';
import { League } from '../src/models/League.js';
import { Competitor } from '../src/models/Competitor.js';
import { Round } from '../src/models/Round.js';
import { Submission } from '../src/models/Submission.js';
import { Vote } from '../src/models/Vote.js';
import { SongMetadata } from '../src/models/SongMetadata.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection URL
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

// Data directories
const LEAGUE_DIRS = [
  '../public/data/league-1-Data',
  '../public/data/league-2-Data'
];

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

async function connectToDatabase() {
  let connectionString = MONGODB_URL;
  if (!connectionString.endsWith('/')) {
    connectionString += '/';
  }
  // If DB_NAME is not in the URL, append it
  if (!connectionString.includes(DB_NAME)) {
    connectionString += DB_NAME;
  }

  if (!connectionString.includes('authSource')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString += `${separator}authSource=admin`;
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(connectionString);
  console.log('Connected successfully to MongoDB');
}

async function seedDatabase() {
  try {
    await connectToDatabase();

    // Clear existing collections
    console.log('\nClearing existing collections...');
    await League.deleteMany({});
    await Competitor.deleteMany({});
    await Round.deleteMany({});
    await Submission.deleteMany({});
    await Vote.deleteMany({});
    await SongMetadata.deleteMany({});

    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.collection('genres').drop();
        console.log('Dropped collection: genres');
      }
    } catch (e) {
      if (e.code !== 26) console.log('Error dropping genres (might not exist):', e.message);
    }

    console.log('Collections cleared.');

    // Seed data for each league
    for (let leagueIndex = 0; leagueIndex < LEAGUE_DIRS.length; leagueIndex++) {
      const leagueDir = LEAGUE_DIRS[leagueIndex];
      const leagueId = leagueIndex + 1;

      console.log(`\n--- Processing League ${leagueId} from ${leagueDir} ---`);

      // Create league document
      const leagueName = leagueDir.includes('league-1') ? 'League 1' : 'League 2';
      await League.create({
        _id: leagueId,
        name: leagueName,
      });
      console.log(`Created league: ${leagueName}`);

      // Read and insert competitors
      const competitorsPath = path.join(__dirname, leagueDir, 'competitors.csv');
      if (fs.existsSync(competitorsPath)) {
        const competitors = await readCSV(competitorsPath);
        let insertedCount = 0;
        let updatedCount = 0;

        for (const comp of competitors) {
          try {
            // Try to find existing competitor
            const existing = await Competitor.findById(comp.ID);
            if (existing) {
              if (!existing.leagues.includes(leagueId)) {
                existing.leagues.push(leagueId);
                await existing.save();
                updatedCount++;
              }
            } else {
              await Competitor.create({
                _id: comp.ID,
                name: comp.Name,
                leagues: [leagueId]
              });
              insertedCount++;
            }
          } catch (error) {
            console.error(`Error processing competitor ${comp.Name}:`, error);
          }
        }
        console.log(`Competitors: ${insertedCount} new, ${updatedCount} updated`);
      }

      // Read and insert rounds
      const roundsPath = path.join(__dirname, leagueDir, 'rounds.csv');
      if (fs.existsSync(roundsPath)) {
        const rounds = await readCSV(roundsPath);
        const roundsWithLeague = rounds.map(round => ({
          _id: round.ID,
          name: round.Name,
          description: round.Description,
          playlistUrl: round['Playlist URL'],
          startDate: round.Created ? new Date(round.Created) : undefined,
          leagueId: leagueId
        }));

        if (roundsWithLeague.length > 0) {
          await Round.insertMany(roundsWithLeague);
          console.log(`Inserted ${roundsWithLeague.length} rounds`);
        }
      }

      // Read and insert submissions
      const submissionsPath = path.join(__dirname, leagueDir, 'submissions.csv');
      if (fs.existsSync(submissionsPath)) {
        const submissions = await readCSV(submissionsPath);
        const submissionsWithLeague = submissions.map(submission => ({
          spotifyUri: submission['Spotify URI'],
          title: submission.Title,
          album: submission.Album,
          artists: submission['Artist(s)'] ? [submission['Artist(s)']] : [],
          submitterId: submission['Submitter ID'],
          comment: submission.Comment,
          roundId: submission['Round ID'],
          leagueId: leagueId
        }));
        if (submissionsWithLeague.length > 0) {
          await Submission.insertMany(submissionsWithLeague);
          console.log(`Inserted ${submissionsWithLeague.length} submissions`);
        }
      }

      // Read and insert votes
      const votesPath = path.join(__dirname, leagueDir, 'votes.csv');
      if (fs.existsSync(votesPath)) {
        const votes = await readCSV(votesPath);
        const votesWithLeague = votes.map(vote => ({
          spotifyUri: vote['Spotify URI'],
          voterId: vote['Voter ID'],
          pointsAssigned: parseInt(vote['Points Assigned']) || 0,
          comment: vote.Comment,
          roundId: vote['Round ID'],
          leagueId: leagueId
        }));
        if (votesWithLeague.length > 0) {
          await Vote.insertMany(votesWithLeague);
          console.log(`Inserted ${votesWithLeague.length} votes`);
        }
      }
    }

    // Fetch and store song metadata from Spotify
    const skipMetadata = process.argv.includes('--skip-metadata');
    if (!skipMetadata) {
      console.log('\n--- Fetching Song Metadata from Spotify ---');
      try {
        const uniqueSpotifyUris = await Submission.distinct('spotifyUri');
        console.log(`Found ${uniqueSpotifyUris.length} unique songs to fetch metadata for`);

        const audioFeatures = await spotifyClient.getAllAudioFeatures(
          uniqueSpotifyUris,
          (progress) => {
            console.log(`Progress: ${progress.percentage}% (${progress.current}/${progress.total})`);
          }
        );

        if (audioFeatures.length > 0) {
          await SongMetadata.insertMany(audioFeatures);
          console.log(`✅ Inserted ${audioFeatures.length} song metadata records`);
        } else {
          console.log('⚠️  No audio features were fetched');
        }
      } catch (error) {
        console.error('❌ Error fetching song metadata:', error.message);
        console.log('Continuing without metadata. You can run the backfill script later.');
      }
    } else {
      console.log('\n⏭️  Skipping metadata fetch (--skip-metadata flag provided)');
    }

    // Print summary
    console.log('\n=== Database Seeding Summary ===');
    console.log(`Leagues: ${await League.countDocuments()}`);
    console.log(`Competitors: ${await Competitor.countDocuments()}`);
    console.log(`Rounds: ${await Round.countDocuments()}`);
    console.log(`Submissions: ${await Submission.countDocuments()}`);
    console.log(`Votes: ${await Vote.countDocuments()}`);
    console.log(`Song Metadata: ${await SongMetadata.countDocuments()}`);
    console.log('\n✅ Database seeded successfully!');
    console.log('\n💡 To populate genres and add genre field to songs, run:');
    console.log('   node scripts/seed-genres.js');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seeder if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}

export { seedDatabase };
