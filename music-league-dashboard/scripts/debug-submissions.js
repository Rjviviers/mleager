import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Submission } from '../src/models/Submission.js';
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

async function debugSubmissions() {
    console.log('🚀 Debugging Submissions...');

    try {
        const count = await Submission.countDocuments();
        console.log(`\n📊 Total Submissions: ${count}`);

        if (count > 0) {
            const sample = await Submission.findOne();
            console.log('\n📄 Sample Submission:', JSON.stringify(sample, null, 2));
        } else {
            console.log('⚠️ No submissions found in the database.');
        }

    } catch (error) {
        console.error('❌ Error debugging submissions:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

async function main() {
    await connectDB();
    await debugSubmissions();
}

main();
