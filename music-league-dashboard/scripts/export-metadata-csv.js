#!/usr/bin/env node

/**
 * Export Song Metadata to CSV
 *
 * This script exports song metadata from MongoDB to CSV files
 * that can be used by the frontend.
 *
 * Usage:
 *   node scripts/export-metadata-csv.js
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

async function exportMetadataToCSV() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log('🎵 Exporting Song Metadata to CSV');
    console.log('==================================\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(DB_NAME);

    // Get all metadata
    console.log('📊 Fetching metadata from database...');
    const metadata = await db.collection('song_metadata')
      .find({})
      .toArray();

    console.log(`Found ${metadata.length} metadata records\n`);

    if (metadata.length === 0) {
      console.log('⚠️  No metadata found in database');
      console.log('Run "npm run fetch-metadata" first to populate metadata\n');
      return;
    }

    // Convert to CSV format
    const csvHeader = 'Spotify URI,Energy,Danceability,Valence,Acousticness,Instrumentalness,Liveness,Speechiness,Tempo,Key,Mode,Time Signature,Loudness,Duration (ms),Genre,All Genres,Fetched At\n';

    const csvRows = metadata.map(m => {
      // Escape genres if they contain commas
      const genre = m.genre || '';
      const allGenres = m.allGenres ? m.allGenres.join('; ') : '';  // Use semicolon to avoid CSV issues

      return [
        m.spotifyUri,
        m.energy,
        m.danceability,
        m.valence,
        m.acousticness,
        m.instrumentalness,
        m.liveness,
        m.speechiness,
        m.tempo,
        m.key,
        m.mode,
        m.time_signature,
        m.loudness,
        m.duration_ms,
        genre,
        allGenres,
        m.fetchedAt ? new Date(m.fetchedAt).toISOString() : ''
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Write to public data directory
    const outputPath = path.join(__dirname, '../public/data/song_metadata.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`✅ Exported metadata to: ${outputPath}`);
    console.log(`   ${metadata.length} records written\n`);

    // Print statistics
    console.log('=== Metadata Statistics ===');

    const avgEnergy = (metadata.reduce((sum, m) => sum + m.energy, 0) / metadata.length).toFixed(3);
    const avgDanceability = (metadata.reduce((sum, m) => sum + m.danceability, 0) / metadata.length).toFixed(3);
    const avgValence = (metadata.reduce((sum, m) => sum + m.valence, 0) / metadata.length).toFixed(3);

    console.log(`Average Energy: ${avgEnergy}`);
    console.log(`Average Danceability: ${avgDanceability}`);
    console.log(`Average Valence: ${avgValence}`);

    const withGenre = metadata.filter(m => m.genre).length;
    console.log(`Songs with Genre: ${withGenre}/${metadata.length} (${Math.round(withGenre/metadata.length*100)}%)`);

    console.log('\n✅ Export complete!');

  } catch (error) {
    console.error('\n❌ Error during export:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the export
exportMetadataToCSV();

