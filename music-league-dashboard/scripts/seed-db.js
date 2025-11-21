import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import { spotifyClient } from '../src/utils/spotify.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection URL
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = 'music_league';

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

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db(DB_NAME);

    // Clear existing collections
    console.log('\nClearing existing collections...');
    const collections = ['competitors', 'rounds', 'submissions', 'votes', 'leagues', 'song_metadata', 'genres'];
    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).drop();
        console.log(`Dropped collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 26) {
          console.log(`Collection ${collectionName} doesn't exist, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Seed data for each league
    for (let leagueIndex = 0; leagueIndex < LEAGUE_DIRS.length; leagueIndex++) {
      const leagueDir = LEAGUE_DIRS[leagueIndex];
      const leagueId = leagueIndex + 1;

      console.log(`\n--- Processing League ${leagueId} from ${leagueDir} ---`);

      // Create league document
      const leagueName = leagueDir.includes('league-1') ? 'League 1' : 'League 2';
      await db.collection('leagues').insertOne({
        _id: leagueId,
        name: leagueName,
        createdAt: new Date()
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
            // Try to insert the competitor
            await db.collection('competitors').insertOne({
              _id: comp.ID,
              name: comp.Name,
              leagues: [leagueId]
            });
            insertedCount++;
          } catch (error) {
            if (error.code === 11000) {
              // Competitor already exists, add this league to their leagues array
              await db.collection('competitors').updateOne(
                { _id: comp.ID },
                { $addToSet: { leagues: leagueId } }
              );
              updatedCount++;
            } else {
              throw error;
            }
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
          created: new Date(round.Created),
          leagueId: leagueId
        }));
        if (roundsWithLeague.length > 0) {
          await db.collection('rounds').insertMany(roundsWithLeague);
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
          artists: submission['Artist(s)'],
          submitterId: submission['Submitter ID'],
          created: new Date(submission.Created),
          comment: submission.Comment,
          roundId: submission['Round ID'],
          visibleToVoters: submission['Visible To Voters'],
          leagueId: leagueId
        }));
        if (submissionsWithLeague.length > 0) {
          await db.collection('submissions').insertMany(submissionsWithLeague);
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
          created: new Date(vote.Created),
          pointsAssigned: parseInt(vote['Points Assigned']) || 0,
          comment: vote.Comment,
          roundId: vote['Round ID'],
          leagueId: leagueId
        }));
        if (votesWithLeague.length > 0) {
          await db.collection('votes').insertMany(votesWithLeague);
          console.log(`Inserted ${votesWithLeague.length} votes`);
        }
      }
    }

    // Create indexes for better query performance
    console.log('\nCreating indexes...');
    await db.collection('competitors').createIndex({ leagues: 1 });
    await db.collection('competitors').createIndex({ name: 1 });
    await db.collection('rounds').createIndex({ leagueId: 1 });
    await db.collection('submissions').createIndex({ leagueId: 1, roundId: 1 });
    await db.collection('submissions').createIndex({ submitterId: 1 });
    await db.collection('submissions').createIndex({ spotifyUri: 1 });
    await db.collection('votes').createIndex({ leagueId: 1, roundId: 1 });
    await db.collection('votes').createIndex({ voterId: 1 });
    await db.collection('votes').createIndex({ spotifyUri: 1 });
    await db.collection('song_metadata').createIndex({ spotifyUri: 1 }, { unique: true });
    await db.collection('song_metadata').createIndex({ genre: 1 });
    await db.collection('genres').createIndex({ name: 1 }, { unique: true });
    console.log('Indexes created successfully');

    // Fetch and store song metadata from Spotify
    const skipMetadata = process.argv.includes('--skip-metadata');
    if (!skipMetadata) {
      console.log('\n--- Fetching Song Metadata from Spotify ---');
      try {
        // Get all unique Spotify URIs from submissions
        const allSubmissions = await db.collection('submissions').find({}).toArray();
        const uniqueSpotifyUris = [...new Set(allSubmissions.map(s => s.spotifyUri))];

        console.log(`Found ${uniqueSpotifyUris.length} unique songs to fetch metadata for`);

        // Fetch audio features from Spotify
        const audioFeatures = await spotifyClient.getAllAudioFeatures(
          uniqueSpotifyUris,
          (progress) => {
            console.log(`Progress: ${progress.percentage}% (${progress.current}/${progress.total})`);
          }
        );

        // Insert metadata into database
        if (audioFeatures.length > 0) {
          await db.collection('song_metadata').insertMany(audioFeatures);
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
    console.log(`Leagues: ${await db.collection('leagues').countDocuments()}`);
    console.log(`Competitors: ${await db.collection('competitors').countDocuments()}`);
    console.log(`Rounds: ${await db.collection('rounds').countDocuments()}`);
    console.log(`Submissions: ${await db.collection('submissions').countDocuments()}`);
    console.log(`Votes: ${await db.collection('votes').countDocuments()}`);
    console.log(`Song Metadata: ${await db.collection('song_metadata').countDocuments()}`);
    console.log(`Genres: ${await db.collection('genres').countDocuments()}`);
    console.log('\n✅ Database seeded successfully!');
    console.log('\n💡 To populate genres and add genre field to songs, run:');
    console.log('   node scripts/seed-genres.js');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the seeder
seedDatabase();

