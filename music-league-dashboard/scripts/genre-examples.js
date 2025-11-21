#!/usr/bin/env node

/**
 * Example queries for working with genre data
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

async function runExamples() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('🎵 Genre Data Examples\n');
    console.log('======================\n');

    // Example 1: Get all songs with their genres
    console.log('📊 Example 1: Songs with Genres');
    console.log('--------------------------------');

    const songsWithGenres = await db.collection('song_metadata').aggregate([
      {
        $lookup: {
          from: 'artist_info',
          localField: 'artists.id',
          foreignField: 'artistId',
          as: 'artistDetails'
        }
      },
      {
        $addFields: {
          allGenres: {
            $reduce: {
              input: '$artistDetails.genres',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      },
      { $limit: 5 }
    ]).toArray();

    songsWithGenres.forEach(song => {
      console.log(`\n🎵 ${song.name}`);
      console.log(`   Artist: ${song.artists[0]?.name}`);
      console.log(`   Genres: ${song.allGenres.length > 0 ? song.allGenres.join(', ') : 'No genres'}`);
    });

    // Example 2: Get all metal songs
    console.log('\n\n📊 Example 2: Find All Metal Songs');
    console.log('-----------------------------------');

    const metalArtists = await db.collection('artist_info')
      .find({ genres: { $regex: /metal/i } })
      .project({ artistId: 1, name: 1, genres: 1 })
      .toArray();

    console.log(`Found ${metalArtists.length} metal artists`);

    const metalArtistIds = metalArtists.map(a => a.artistId);
    const metalSongs = await db.collection('song_metadata')
      .find({ 'artists.id': { $in: metalArtistIds } })
      .limit(5)
      .toArray();

    console.log(`\nSample metal songs:`);
    metalSongs.forEach(song => {
      console.log(`  • ${song.name} - ${song.artists[0]?.name}`);
    });

    // Example 3: Genre distribution
    console.log('\n\n📊 Example 3: Genre Distribution');
    console.log('----------------------------------');

    const genreDistribution = await db.collection('artist_info').aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();

    genreDistribution.forEach((g, i) => {
      const bar = '█'.repeat(Math.ceil(g.count / 2));
      console.log(`${String(i + 1).padStart(2)}. ${g._id.padEnd(25)} ${bar} ${g.count}`);
    });

    // Example 4: Find songs by genre
    console.log('\n\n📊 Example 4: Songs by Specific Genre (Rock)');
    console.log('----------------------------------------------');

    const rockArtists = await db.collection('artist_info')
      .find({ genres: 'rock' })
      .toArray();

    const rockArtistIds = rockArtists.map(a => a.artistId);
    const rockSongs = await db.collection('song_metadata')
      .find({ 'artists.id': { $in: rockArtistIds } })
      .limit(5)
      .toArray();

    console.log(`Found ${rockSongs.length} rock songs (showing 5):`);
    rockSongs.forEach(song => {
      console.log(`  🎸 ${song.name} - ${song.artists[0]?.name}`);
    });

    // Example 5: Multi-genre songs (artists with multiple genres)
    console.log('\n\n📊 Example 5: Artists with Most Genres');
    console.log('----------------------------------------');

    const multiGenreArtists = await db.collection('artist_info')
      .find({ genres: { $exists: true } })
      .sort({ 'genres': -1 })
      .limit(5)
      .toArray();

    multiGenreArtists
      .sort((a, b) => b.genres.length - a.genres.length)
      .forEach(artist => {
        console.log(`\n${artist.name} (${artist.genres.length} genres):`);
        console.log(`  ${artist.genres.join(', ')}`);
      });

    // Example 6: Songs without genre info
    console.log('\n\n📊 Example 6: Coverage Statistics');
    console.log('-----------------------------------');

    const totalSongs = await db.collection('song_metadata').countDocuments();
    const totalArtists = await db.collection('artist_info').countDocuments();
    const artistsWithGenres = await db.collection('artist_info')
      .countDocuments({ genres: { $exists: true, $not: { $size: 0 } } });

    console.log(`Total songs: ${totalSongs}`);
    console.log(`Total artists: ${totalArtists}`);
    console.log(`Artists with genres: ${artistsWithGenres} (${((artistsWithGenres / totalArtists) * 100).toFixed(1)}%)`);
    console.log(`Artists without genres: ${totalArtists - artistsWithGenres}`);

    console.log('\n✅ Examples complete!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

runExamples();

