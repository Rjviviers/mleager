import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Song } from '../src/models/Song.js';
import { Submission } from '../src/models/Submission.js';
import { SongMetadata } from '../src/models/SongMetadata.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function connectDB() {
    const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
    const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

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
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');
}

async function populateSongs() {
    console.log('🚀 Starting Song population...');

    try {
        // 1. Aggregate Submissions to count occurrences of each spotifyUri
        const submissionCounts = await Submission.aggregate([
            {
                $group: {
                    _id: '$spotifyUri',
                    count: { $sum: 1 },
                    // Keep one example of metadata in case SongMetadata is missing
                    sampleTitle: { $first: '$title' },
                    sampleArtists: { $first: '$artists' }
                }
            }
        ]);

        console.log(`Found ${submissionCounts.length} unique songs in submissions.`);

        for (const item of submissionCounts) {
            const spotifyUri = item._id;
            const count = item.count;

            // 2. Fetch details from SongMetadata
            let metadata = await SongMetadata.findOne({ spotifyUri });

            let name = metadata ? metadata.name : item.sampleTitle;
            let artists = metadata ? (Array.isArray(metadata.artists) ? metadata.artists : [metadata.artists]) : item.sampleArtists;

            // Fallback if artists is not an array or is missing
            if (!artists) {
                artists = ['Unknown Artist'];
            } else if (!Array.isArray(artists)) {
                artists = [artists];
            }

            // Map artist objects to strings (names)
            artists = artists.map(artist => {
                if (typeof artist === 'object' && artist !== null && artist.name) {
                    return artist.name;
                }
                return String(artist);
            });

            if (!name) {
                name = 'Unknown Title';
            }

            let genres = [];
            if (metadata) {
                if (metadata.allGenres && metadata.allGenres.length > 0) {
                    genres = metadata.allGenres;
                } else if (metadata.genres && metadata.genres.length > 0) {
                    genres = metadata.genres;
                }
            }

            if (metadata) {
                // 3. Upsert Song document
                await Song.findOneAndUpdate(
                    { metadataId: metadata._id },
                    {
                        name: name,
                        artists: artists,
                        name: name,
                        artists: artists,
                        submissionCount: count,
                        genres: genres
                    },
                    { upsert: true, new: true }
                );
            } else {
                console.warn(`⚠️ Metadata not found for ${spotifyUri}. Skipping Song creation.`);
            }
            // process.stdout.write('.');
        }

        console.log('\n✅ Song population complete!');

    } catch (error) {
        console.error('❌ Error populating songs:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

async function main() {
    await connectDB();
    await populateSongs();
}

main();
