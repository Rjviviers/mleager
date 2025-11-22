import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;

function runCommand(command, args = [], options = {}) {
    console.log(`\n> ${command} ${args.join(' ')}`);
    try {
        execSync(`${command} ${args.join(' ')}`, { stdio: 'inherit', cwd: rootDir, ...options });
    } catch (error) {
        console.error(`Error executing command: ${command} ${args.join(' ')}`);
        throw error;
    }
}

async function waitForMongoDB() {
    console.log('⏳ Waiting for MongoDB to be ready...');
    const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';

    // Adjust connection string if needed (e.g. add authSource)
    let connectionString = MONGODB_URL;
    if (!connectionString.includes('authSource')) {
        const separator = connectionString.includes('?') ? '&' : '?';
        connectionString += `${separator}authSource=admin`;
    }

    let retries = 30;
    while (retries > 0) {
        try {
            await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 2000 });
            console.log('✅ MongoDB is ready!');
            await mongoose.disconnect();
            return;
        } catch (error) {
            process.stdout.write('.');
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.error('\n❌ MongoDB failed to start after 30 seconds.');
    process.exit(1);
}

async function main() {
    console.log('🚀 Starting Music League Dashboard Setup...');

    // 1. Check .env
    const envPath = path.join(rootDir, '.env');
    const envTemplatePath = path.join(rootDir, 'env.template');

    if (!fs.existsSync(envPath)) {
        console.log('⚠️  .env not found. Copying from env.template...');
        if (fs.existsSync(envTemplatePath)) {
            fs.copyFileSync(envTemplatePath, envPath);
            console.log('✅ .env created.');
        } else {
            console.error('❌ env.template not found! Cannot create .env.');
            process.exit(1);
        }
    } else {
        console.log('✅ .env already exists.');
    }

    // 2. Start Docker
    console.log('\n🐳 Starting Docker Containers...');
    try {
        runCommand('docker-compose', ['up', '-d']);
        console.log('✅ Docker containers started.');
    } catch (error) {
        console.error('❌ Failed to start Docker. Make sure Docker is running.');
        process.exit(1);
    }

    // 3. Wait for MongoDB
    await waitForMongoDB();

    // 4. Run DB Seeds
    console.log('\n🌱 Running Database Seeds...');
    try {
        runCommand('node', ['scripts/seed-db.js', '--skip-metadata']);
    } catch (e) {
        console.error('❌ Seed failed.');
        process.exit(1);
    }

    // 5. Run Basic Meta Fetch
    console.log('\n🎵 Running Basic Metadata Fetch...');
    try {
        runCommand('node', ['scripts/fetch-basic-metadata.js']);
    } catch (e) {
        console.error('❌ Metadata fetch failed.');
        // Don't exit, maybe partial success is ok
    }

    console.log('\n✅ Setup Complete!');
    console.log('   Backend running on port specified in .env (default 3003)');
    console.log('   Frontend running on port specified in .env (default 3002)');
}

main().catch(console.error);
