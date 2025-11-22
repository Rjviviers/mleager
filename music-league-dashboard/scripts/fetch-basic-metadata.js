#!/usr/bin/env node

/**
 * Fetch Basic Track Metadata (No Quota Extension Required)
 *
 * This script fetches basic track information from Spotify API
 * that doesn't require Extended Quota Mode:
 * - Track name, artist, album
 * - Release date, popularity
 * - Duration, explicit flag
 * - Album art URLs
 *
 * Audio features (energy, danceability, etc.) require Extended Quota Mode
 */

import mongoose from 'mongoose';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { SongMetadata } from '../src/models/SongMetadata.js';
import { Submission } from '../src/models/Submission.js';

dotenv.config();

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';
const MAX_TRACKS_PER_REQUEST = 50; // Spotify allows up to 50 tracks per batch

class SpotifyBasicClient {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  async authenticate() {

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    try {
      const response = await axios.post(
        SPOTIFY_TOKEN_URL,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log('✅ Spotify authentication successful');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Spotify authentication failed:', error.message);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  uriToId(spotifyUri) {
    return spotifyUri.split(':').pop();
  }

  async getBatchTrackInfo(spotifyUris) {
    const trackIds = spotifyUris.map(uri => this.uriToId(uri)).join(',');
    const url = `${SPOTIFY_API_BASE_URL}/tracks?ids=${trackIds}`;

    try {
      const token = await this.authenticate();
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.tracks
        .map((track, index) => {
          if (!track) {
            console.warn(`⚠️  No track info found for ${spotifyUris[index]}`);
            return null;
          }
          return this.formatTrackInfo(track, spotifyUris[index]);
        })
        .filter(Boolean);
    } catch (error) {
      console.error('❌ Failed to fetch batch track info:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
      }
      return [];
    }
  }

  formatTrackInfo(track, spotifyUri) {
    return {
      spotifyUri,
      // Basic track info
      name: track.name,
      artists: track.artists.map(a => ({
        name: a.name,
        id: a.id,
        uri: a.uri
      })),
      album: {
        name: track.album.name,
        id: track.album.id,
        uri: track.album.uri,
        release_date: track.album.release_date,
        release_date_precision: track.album.release_date_precision,
        images: track.album.images
      },
      // Track attributes
      duration_ms: track.duration_ms,
      explicit: track.explicit,
      popularity: track.popularity, // 0-100
      // Preview URL (30 second preview if available)
      preview_url: track.preview_url,
      // External URLs
      spotify_url: track.external_urls?.spotify,
      // Metadata
      fetchedAt: new Date(),
      lastUpdated: new Date()
    };
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAllTrackInfo(spotifyUris) {
    const allInfo = [];
    const batches = this.chunkArray(spotifyUris, MAX_TRACKS_PER_REQUEST);

    console.log(`📊 Fetching basic metadata for ${spotifyUris.length} tracks in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} tracks)...`);

      const info = await this.getBatchTrackInfo(batch);
      allInfo.push(...info);

      // Small delay between batches
      if (i < batches.length - 1) {
        await this.sleep(100);
      }
    }

    console.log(`✅ Successfully fetched ${allInfo.length}/${spotifyUris.length} track metadata`);
    return allInfo;
  }
}

async function connectToDatabase() {
  let connectionString = MONGODB_URL;
  if (!connectionString.endsWith('/')) {
    connectionString += '/';
  }
  if (!connectionString.includes(DB_NAME)) {
    connectionString += DB_NAME;
  }

  if (!connectionString.includes('authSource')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    connectionString += `${separator}authSource=admin`;
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(connectionString);
  console.log('✅ Connected to MongoDB\n');
}

async function fetchBasicMetadata() {
  const spotifyClient = new SpotifyBasicClient();

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const limitIndex = args.indexOf('--limit');
    const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;

    console.log('🎵 Basic Song Metadata Script (No Quota Extension Required)');
    console.log('============================================================\n');

    if (force) {
      console.log('⚠️  Force mode: Will re-fetch existing metadata');
    }
    if (limit) {
      console.log(`⚠️  Limit mode: Processing only ${limit} songs\n`);
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Get all unique Spotify URIs from submissions
    console.log('📊 Analyzing submissions...');
    const uniqueSpotifyUris = await Submission.distinct('spotifyUri');
    console.log(`Found ${uniqueSpotifyUris.length} unique songs\n`);

    // Filter out songs that already have metadata (unless force mode)
    let songsToFetch = uniqueSpotifyUris;
    if (!force) {
      const existingMetadata = await SongMetadata.find({ spotifyUri: { $in: uniqueSpotifyUris } }).select('spotifyUri');
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

    // Fetch track info from Spotify
    console.log(`🎵 Fetching metadata for ${songsToFetch.length} songs...\n`);

    const startTime = Date.now();
    const trackInfo = await spotifyClient.getAllTrackInfo(songsToFetch);

    const successCount = trackInfo.length;
    const failureCount = songsToFetch.length - successCount;

    // Store metadata in database
    if (trackInfo.length > 0) {
      console.log(`\n💾 Storing metadata in database...`);

      if (force) {
        // Use bulk upsert operations for force mode
        const bulkOps = trackInfo.map(info => ({
          updateOne: {
            filter: { spotifyUri: info.spotifyUri },
            update: { $set: info },
            upsert: true
          }
        }));

        const result = await SongMetadata.bulkWrite(bulkOps);
        console.log(`✅ Upserted ${result.upsertedCount + result.modifiedCount} records`);
      } else {
        // Use insertMany for new records
        // Note: insertMany might fail on duplicates if not handled, but we filtered them out unless force is on.
        // If force is on, we used bulkWrite.
        // If force is off, we filtered out existing.
        // However, there might be duplicates within the batch if the input had duplicates (distinct handled that).
        // Or if race condition.
        // Let's use bulkWrite with upsert even for non-force to be safe? 
        // Or just insertMany with ordered: false.
        try {
          await SongMetadata.insertMany(trackInfo, { ordered: false });
          console.log(`✅ Inserted ${trackInfo.length} new records`);
        } catch (e) {
          if (e.code === 11000) {
            console.log(`✅ Inserted some records (some duplicates skipped)`);
          } else {
            throw e;
          }
        }
      }
    }

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total unique songs: ${uniqueSpotifyUris.length}`);
    console.log(`Songs processed: ${songsToFetch.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);

    const totalInDb = await SongMetadata.countDocuments();
    console.log(`\nTotal metadata records in DB: ${totalInDb}`);

    const coverage = ((totalInDb / uniqueSpotifyUris.length) * 100).toFixed(1);
    console.log(`Coverage: ${coverage}%`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total time: ${duration}s`);
    console.log('\n✅ Metadata fetch complete!');

    console.log('\n💡 Note: This fetches basic track info only.');
    console.log('   For audio features (energy, danceability, etc.),');
    console.log('   you need to request Extended Quota Mode from Spotify.');

  } catch (error) {
    console.error('\n❌ Error during metadata fetch:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed');
  }
}

fetchBasicMetadata();
