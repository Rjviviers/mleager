#!/usr/bin/env node

/**
 * Update Popularity Script
 * 
 * Fetches the latest popularity scores (0-100) from Spotify for all songs
 * in the song_metadata collection and updates them.
 */

import { MongoClient } from 'mongodb';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';
const MAX_TRACKS_PER_REQUEST = 50;

class SpotifyPopularityClient {
    constructor() {
        this.accessToken = null;
        this.tokenExpiresAt = null;
    }

    async authenticate() {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
        }

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
            throw error;
        }
    }

    async getBatchPopularity(spotifyUris) {
        const trackIds = spotifyUris.map(uri => uri.split(':').pop()).join(',');
        const url = `${SPOTIFY_API_BASE_URL}/tracks?ids=${trackIds}`;

        try {
            const token = await this.authenticate();
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            return response.data.tracks.map(track => {
                if (!track) return null;
                return {
                    spotifyUri: track.uri,
                    popularity: track.popularity
                };
            }).filter(Boolean);
        } catch (error) {
            console.error('❌ Failed to fetch batch popularity:', error.message);
            return [];
        }
    }

    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

async function updatePopularity() {
    const client = new MongoClient(MONGODB_URL);
    const spotify = new SpotifyPopularityClient();

    try {
        console.log('📈 Updating Song Popularity Scores');
        console.log('=================================\n');

        await client.connect();
        const db = client.db(DB_NAME);

        // Get all songs from metadata
        const songs = await db.collection('song_metadata').find({}, { projection: { spotifyUri: 1 } }).toArray();
        const uris = songs.map(s => s.spotifyUri);

        console.log(`Found ${uris.length} songs to update.`);

        if (uris.length === 0) {
            console.log('No songs found in metadata.');
            return;
        }

        const batches = spotify.chunkArray(uris, MAX_TRACKS_PER_REQUEST);
        let updatedCount = 0;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} songs)...`);

            const results = await spotify.getBatchPopularity(batch);

            if (results.length > 0) {
                const bulkOps = results.map(item => ({
                    updateOne: {
                        filter: { spotifyUri: item.spotifyUri },
                        update: {
                            $set: {
                                popularity: item.popularity,
                                popularityUpdated: new Date()
                            }
                        }
                    }
                }));

                const result = await db.collection('song_metadata').bulkWrite(bulkOps);
                updatedCount += result.modifiedCount;
            }

            if (i < batches.length - 1) await spotify.sleep(100);
        }

        console.log(`\n✅ Successfully updated popularity for ${updatedCount} songs.`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

updatePopularity();
