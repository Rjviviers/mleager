import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Song } from '../src/models/Song.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function connectDB() {
    const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
    let connectionString = MONGODB_URL;
    if (!connectionString.includes('authSource')) {
        const separator = connectionString.includes('?') ? '&' : '?';
        connectionString += `${separator}authSource=admin`;
    }
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');
}

async function verifySongs() {
    console.log('🚀 Verifying Song population...');

    try {
        const count = await Song.countDocuments();
        console.log(`\n📊 Total Songs: ${count}`);

        if (count === 0) {
            console.log('⚠️ No songs found. Did you run the population script?');
            return;
        }

        const songs = await Song.find().limit(5);
        console.log('\n🎵 First 5 Songs:');
        songs.forEach(song => {
            console.log(`- ${song.name} by ${song.artists.join(', ')} (Submitted ${song.submissionCount} times)`);
        });

    } catch (error) {
        console.error('❌ Error verifying songs:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

async function main() {
    await connectDB();
    await verifySongs();
}

main();
