#!/usr/bin/env node

/**
 * Test API Data Integrity
 * 
 * Verifies that the database contains the necessary fields for the frontend
 * to function without mocks:
 * - Genre
 * - Popularity
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

async function testApiData() {
    const client = new MongoClient(MONGODB_URL);

    try {
        console.log('🧪 Testing API Data Integrity');
        console.log('=============================\n');

        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection('song_metadata');

        const totalSongs = await collection.countDocuments();
        console.log(`Total songs in metadata: ${totalSongs}`);

        if (totalSongs === 0) {
            console.error('❌ No songs found in metadata! Run fetch-basic-metadata.js first.');
            return;
        }

        // Check Genre
        const songsWithGenre = await collection.countDocuments({ genre: { $exists: true, $ne: null } });
        const genreCoverage = ((songsWithGenre / totalSongs) * 100).toFixed(1);

        console.log(`\nGenre Coverage: ${songsWithGenre}/${totalSongs} (${genreCoverage}%)`);
        if (genreCoverage < 100) {
            console.warn('⚠️  Some songs are missing genre. Run fetch-genres.js --force');
        } else {
            console.log('✅ All songs have genre.');
        }

        // Check Popularity
        const songsWithPopularity = await collection.countDocuments({ popularity: { $exists: true, $ne: null } });
        const popularityCoverage = ((songsWithPopularity / totalSongs) * 100).toFixed(1);

        console.log(`Popularity Coverage: ${songsWithPopularity}/${totalSongs} (${popularityCoverage}%)`);
        if (popularityCoverage < 100) {
            console.warn('⚠️  Some songs are missing popularity. Run update-popularity.js');
        } else {
            console.log('✅ All songs have popularity.');
        }

        // Sample Check
        const sample = await collection.findOne({ genre: { $exists: true }, popularity: { $exists: true } });
        if (sample) {
            console.log('\n✅ Sample Valid Record:');
            console.log(`   Title: ${sample.name || 'Unknown'}`); // Note: name might be in 'name' or 'title' depending on fetch script
            console.log(`   Genre: ${sample.genre}`);
            console.log(`   Popularity: ${sample.popularity}`);
        } else {
            console.error('\n❌ Could not find a single complete record!');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

testApiData();
