#!/usr/bin/env node

/**
 * Backfill Script for Song Metadata
 *
 * This script fetches audio features from Spotify API for all songs
 * in the submissions collection and stores them in the song_metadata collection.
 *
 * Usage:
 *   node scripts/fetch-song-metadata.js [options]
 *
 * Options:
 *   --force     Re-fetch metadata even if it already exists
 *   --limit N   Only process first N songs (useful for testing)
 */

import { MongoClient } from 'mongodb';
import { spotifyClient } from '../src/utils/spotify.js';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

async function fetchSongMetadata() {
  const client = new MongoClient(MONGODB_URL);

  try {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limitIndex = args.indexOf('--limit');
    const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;

    console.log('🎵 Song Metadata Backfill Script');
    console.log('================================\n');

    if (force) {
      console.log('⚠️  Force mode: Will re-fetch existing metadata');
    }
    if (limit) {
      console.log(`⚠️  Limit mode: Processing only ${limit} songs\n`);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Get all unique Spotify URIs from submissions
    console.log('📊 Analyzing submissions...');
    const allSubmissions = await db.collection('submissions').find({}).toArray();
    const uniqueSpotifyUris = [...new Set(allSubmissions.map(s => s.spotifyUri))];
    console.log(`Found ${uniqueSpotifyUris.length} unique songs\n`);

    // Filter out songs that already have metadata (unless force mode)
    let songsToFetch = uniqueSpotifyUris;
    if (!force) {
      const existingMetadata = await db.collection('song_metadata')
        .find({ spotifyUri: { $in: uniqueSpotifyUris } })
        .project({ spotifyUri: 1 })
        .toArray();

      const existingUris = new Set(existingMetadata.map(m => m.spotifyUri));
      songsToFetch = uniqueSpotifyUris.filter(uri => !existingUris.has(uri));

      console.log(`${existingMetadata.length} songs already have metadata`);
      console.log(`${songsToFetch.length} songs need metadata\n`);
    }

    // Apply limit if specified
    if (limit && limit < songsToFetch.length) {
      songsToFetch = songsToFetch.slice(0, limit);
      console.log(`Limiting to ${limit} songs\n`);
    }

    if (songsToFetch.length === 0) {
      console.log('✅ All songs already have metadata!');
      console.log('Use --force to re-fetch existing metadata\n');
      return;
    }

    // Fetch audio features from Spotify
    console.log(`🎵 Fetching metadata for ${songsToFetch.length} songs...\n`);

    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;

    const audioFeatures = await spotifyClient.getAllAudioFeatures(
      songsToFetch,
      (progress) => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (progress.current / elapsed).toFixed(1);
        console.log(
          `Progress: ${progress.percentage}% | ` +
          `${progress.current}/${progress.total} | ` +
          `${elapsed}s elapsed | ` +
          `${rate} songs/s`
        );
      }
    );

    successCount = audioFeatures.length;
    failureCount = songsToFetch.length - successCount;

    // Store metadata in database
    if (audioFeatures.length > 0) {
      console.log(`\n💾 Storing metadata in database...`);

      if (force) {
        // Use bulk upsert operations for force mode
        const bulkOps = audioFeatures.map(feature => ({
          updateOne: {
            filter: { spotifyUri: feature.spotifyUri },
            update: { $set: feature },
            upsert: true
          }
        }));

        const result = await db.collection('song_metadata').bulkWrite(bulkOps);
        console.log(`✅ Upserted ${result.upsertedCount + result.modifiedCount} records`);
      } else {
        // Use insertMany for new records
        await db.collection('song_metadata').insertMany(audioFeatures);
        console.log(`✅ Inserted ${audioFeatures.length} new records`);
      }
    }

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total unique songs: ${uniqueSpotifyUris.length}`);
    console.log(`Songs processed: ${songsToFetch.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);

    const totalInDb = await db.collection('song_metadata').countDocuments();
    console.log(`\nTotal metadata records in DB: ${totalInDb}`);

    const coverage = ((totalInDb / uniqueSpotifyUris.length) * 100).toFixed(1);
    console.log(`Coverage: ${coverage}%`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total time: ${duration}s`);
    console.log('\n✅ Backfill complete!');

  } catch (error) {
    console.error('\n❌ Error during backfill:', error);

    if (error.message.includes('Spotify credentials')) {
      console.error('\n💡 Make sure you have set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file');
      console.error('Get credentials from: https://developer.spotify.com/dashboard');
    }

    process.exit(1);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Install dotenv if not available
try {
  await import('dotenv');
} catch (error) {
  console.error('❌ dotenv package not found. Installing...');
  const { execSync } = await import('child_process');
  execSync('npm install dotenv', { stdio: 'inherit' });
  console.log('✅ dotenv installed. Please run the script again.');
  process.exit(0);
}

// Run the backfill
fetchSongMetadata();
