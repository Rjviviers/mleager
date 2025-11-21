#!/usr/bin/env node

/**
 * Fetch Genre Information from Spotify
 *
 * Fetches artist information (including genres) for all songs.
 * Works in Development Mode - no Extended Quota required!
 *
 * Note: Spotify assigns genres to artists, not individual tracks.
 * Some artists may have no genres assigned.
 */

import { MongoClient } from 'mongodb';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';
const MAX_ARTISTS_PER_REQUEST = 50; // Spotify allows up to 50 artists per batch

class SpotifyGenreClient {
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

      return this.accessToken;
    } catch (error) {
      console.error('❌ Spotify authentication failed:', error.message);
      throw new Error('Failed to authenticate with Spotify API');
    }
  }

  async getBatchArtistInfo(artistIds) {
    const url = `${SPOTIFY_API_BASE_URL}/artists?ids=${artistIds.join(',')}`;

    try {
      const token = await this.authenticate();
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.artists
        .map((artist, index) => {
          if (!artist) {
            console.warn(`⚠️  No artist info found for ${artistIds[index]}`);
            return null;
          }
          return this.formatArtistInfo(artist);
        })
        .filter(Boolean);
    } catch (error) {
      console.error('❌ Failed to fetch batch artist info:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
      }
      return [];
    }
  }

  formatArtistInfo(artist) {
    return {
      artistId: artist.id,
      artistUri: artist.uri,
      name: artist.name,
      genres: artist.genres || [],
      popularity: artist.popularity,
      followers: artist.followers?.total || 0,
      images: artist.images || [],
      spotify_url: artist.external_urls?.spotify,
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

  async getAllArtistInfo(artistIds) {
    const allInfo = [];
    const batches = this.chunkArray(artistIds, MAX_ARTISTS_PER_REQUEST);

    console.log(`📊 Fetching artist info (including genres) for ${artistIds.length} artists in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} artists)...`);

      const info = await this.getBatchArtistInfo(batch);
      allInfo.push(...info);

      // Small delay between batches
      if (i < batches.length - 1) {
        await this.sleep(150);
      }
    }

    console.log(`✅ Successfully fetched ${allInfo.length}/${artistIds.length} artist info`);
    return allInfo;
  }
}

async function fetchGenres() {
  const mongoClient = new MongoClient(MONGODB_URL);
  const spotifyClient = new SpotifyGenreClient();

  try {
    const args = process.argv.slice(2);
    const force = args.includes('--force');

    console.log('🎸 Genre Information Fetcher');
    console.log('============================\n');

    if (force) {
      console.log('⚠️  Force mode: Will re-fetch existing artist data');
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = mongoClient.db(DB_NAME);

    // Get all unique artist IDs from song metadata or submissions
    console.log('📊 Finding all artists...');

    // First, try to get from song_metadata if it exists
    let artistIds = new Set();
    const metadataCount = await db.collection('song_metadata').countDocuments();

    if (metadataCount > 0) {
      console.log(`Found ${metadataCount} songs with metadata, extracting artists...`);
      const metadata = await db.collection('song_metadata').find({}).toArray();

      metadata.forEach(song => {
        if (song.artists && Array.isArray(song.artists)) {
          song.artists.forEach(artist => {
            if (artist.id) {
              artistIds.add(artist.id);
            }
          });
        }
      });
    } else {
      console.log('No song metadata found. Fetching from Spotify first...');
      console.log('Run: node scripts/fetch-basic-metadata.js');
      process.exit(1);
    }

    const uniqueArtistIds = Array.from(artistIds);
    console.log(`Found ${uniqueArtistIds.length} unique artists\n`);

    if (uniqueArtistIds.length === 0) {
      console.log('❌ No artists found. Make sure you have song metadata first.');
      return;
    }

    // Filter out artists we already have (unless force mode)
    let artistsToFetch = uniqueArtistIds;
    if (!force) {
      const existingArtists = await db.collection('artist_info')
        .find({ artistId: { $in: uniqueArtistIds } })
        .project({ artistId: 1 })
        .toArray();

      const existingIds = new Set(existingArtists.map(a => a.artistId));
      artistsToFetch = uniqueArtistIds.filter(id => !existingIds.has(id));

      console.log(`${existingArtists.length} artists already have data`);
      console.log(`${artistsToFetch.length} artists need data\n`);
    }

    if (artistsToFetch.length === 0) {
      console.log('✅ All artists already have data!');
      console.log('Use --force to re-fetch existing data\n');

      // Show genre statistics
      await showGenreStats(db);
      return;
    }

    // Fetch artist info from Spotify
    console.log(`🎸 Fetching data for ${artistsToFetch.length} artists...\n`);

    const startTime = Date.now();
    console.log('✅ Spotify authentication successful');
    const artistInfo = await spotifyClient.getAllArtistInfo(artistsToFetch);

    const successCount = artistInfo.length;
    const failureCount = artistsToFetch.length - successCount;

    // Store artist info in database
    if (artistInfo.length > 0) {
      console.log(`\n💾 Storing artist data in database...`);

      if (force) {
        const bulkOps = artistInfo.map(info => ({
          updateOne: {
            filter: { artistId: info.artistId },
            update: { $set: info },
            upsert: true
          }
        }));

        const result = await db.collection('artist_info').bulkWrite(bulkOps);
        console.log(`✅ Upserted ${result.upsertedCount + result.modifiedCount} records`);
      } else {
        await db.collection('artist_info').insertMany(artistInfo);
        console.log(`✅ Inserted ${artistInfo.length} new records`);
      }
    }

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total unique artists: ${uniqueArtistIds.length}`);
    console.log(`Artists processed: ${artistsToFetch.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Total time: ${duration}s`);

    // Show genre statistics
    console.log('');
    await showGenreStats(db);

    console.log('\n✅ Genre fetch complete!');

  } catch (error) {
    console.error('\n❌ Error during genre fetch:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    console.log('\nMongoDB connection closed');
  }
}

async function showGenreStats(db) {
  console.log('=== Genre Statistics ===');

  const totalArtists = await db.collection('artist_info').countDocuments();
  const artistsWithGenres = await db.collection('artist_info').countDocuments({
    genres: { $exists: true, $not: { $size: 0 } }
  });
  const artistsWithoutGenres = totalArtists - artistsWithGenres;

  console.log(`Total artists in DB: ${totalArtists}`);
  console.log(`Artists with genres: ${artistsWithGenres} (${((artistsWithGenres / totalArtists) * 100).toFixed(1)}%)`);
  console.log(`Artists without genres: ${artistsWithoutGenres}`);

  // Get top genres
  const genreAgg = await db.collection('artist_info').aggregate([
    { $unwind: '$genres' },
    { $group: { _id: '$genres', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();

  if (genreAgg.length > 0) {
    console.log('\nTop 10 Genres:');
    genreAgg.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g._id} (${g.count} artists)`);
    });
  }
}

fetchGenres();

