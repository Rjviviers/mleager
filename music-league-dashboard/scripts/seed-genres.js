
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Genre } from '../src/models/Genre.js';
import { ArtistInfo } from '../src/models/ArtistInfo.js';
import { SongMetadata } from '../src/models/SongMetadata.js';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

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

  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(connectionString);
  console.log('✅ Connected successfully to MongoDB');
}

async function seedGenres() {
  try {
    await connectToDatabase();

    // Step 1: Extract all unique genres from artist_info collection
    console.log('\n📊 Step 1: Extracting unique genres from artist_info...');

    const genreAggregation = await ArtistInfo.aggregate([
      // Unwind the genres array to get individual genres
      { $unwind: '$genres' },
      // Group by genre to count occurrences
      {
        $group: {
          _id: '$genres',
          count: { $sum: 1 },
          artists: { $push: '$name' }
        }
      },
      // Sort by count descending
      { $sort: { count: -1 } }
    ]);

    console.log(`   Found ${genreAggregation.length} unique genres`);

    // Step 2: Clear and populate the genres collection
    console.log('\n🗑️  Step 2: Clearing existing genres collection...');
    await Genre.deleteMany({});
    console.log('   Dropped genres collection');

    if (genreAggregation.length > 0) {
      console.log('\n💾 Step 3: Populating genres collection...');

      const genreDocs = genreAggregation.map(genre => ({
        name: genre._id,
        artistCount: genre.count,
        createdAt: new Date(),
        lastUpdated: new Date()
      }));

      await Genre.insertMany(genreDocs);
      console.log(`   ✅ Inserted ${genreDocs.length} genres`);

      // Display top 10 genres
      console.log('\n   📈 Top 10 Genres:');
      genreDocs.slice(0, 10).forEach((genre, index) => {
        console.log(`   ${index + 1}. ${genre.name} - ${genre.artistCount} artists`);
      });
    }

    // Step 5: Add genre field to song_metadata
    console.log('\n🎵 Step 5: Adding genre field to song_metadata...');

    const songMetadata = await SongMetadata.find({});
    console.log(`   Processing ${songMetadata.length} songs...`);

    let updatedCount = 0;
    let noGenreCount = 0;

    // Pre-fetch all artist info to avoid N+1 queries
    // This might be memory intensive if there are huge number of artists, but for local setup it should be fine.
    // Optimization: Fetch only needed fields
    const allArtists = await ArtistInfo.find({}).select('artistId genres');
    const artistMap = new Map();
    allArtists.forEach(a => artistMap.set(a.artistId, a.genres));

    const bulkOps = [];

    for (const song of songMetadata) {
      if (!song.artists || !Array.isArray(song.artists) || song.artists.length === 0) {
        noGenreCount++;
        continue;
      }

      // Collect all genres from all artists
      const allGenres = [];
      for (const artist of song.artists) {
        if (artist.id && artistMap.has(artist.id)) {
          const genres = artistMap.get(artist.id);
          if (genres && genres.length > 0) {
            allGenres.push(...genres);
          }
        }
      }

      if (allGenres.length > 0) {
        // Select the first genre (you can modify this logic)
        const selectedGenre = allGenres[0];

        bulkOps.push({
          updateOne: {
            filter: { spotifyUri: song.spotifyUri },
            update: {
              $set: {
                genre: selectedGenre,
                allGenres: [...new Set(allGenres)],  // Store all unique genres
                genreUpdatedAt: new Date()
              }
            }
          }
        });

        updatedCount++;
      } else {
        noGenreCount++;

        bulkOps.push({
          updateOne: {
            filter: { spotifyUri: song.spotifyUri },
            update: {
              $set: {
                genre: null,
                allGenres: [],
                genreUpdatedAt: new Date()
              }
            }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await SongMetadata.bulkWrite(bulkOps);
    }

    console.log(`   ✅ Updated ${updatedCount} songs with genres`);
    console.log(`   ⚠️  ${noGenreCount} songs without genres (artists have no genre data)`);

    // Step 7: Print summary statistics
    console.log('\n📊 Summary Statistics:');

    const genreCount = await Genre.countDocuments();
    const songsWithGenre = await SongMetadata.countDocuments({ genre: { $ne: null } });
    const songsWithoutGenre = await SongMetadata.countDocuments({ genre: null });
    const totalSongs = await SongMetadata.countDocuments();

    console.log(`   Total Genres: ${genreCount}`);
    console.log(`   Songs with Genre: ${songsWithGenre}/${totalSongs} (${Math.round(songsWithGenre / totalSongs * 100)}%)`);
    console.log(`   Songs without Genre: ${songsWithoutGenre}/${totalSongs} (${Math.round(songsWithoutGenre / totalSongs * 100)}%)`);

    // Step 8: Show genre distribution in songs
    console.log('\n📊 Top Genres in Song Metadata:');
    const songGenreDistribution = await SongMetadata.aggregate([
      { $match: { genre: { $ne: null } } },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    songGenreDistribution.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item._id} - ${item.count} songs`);
    });

    console.log('\n✅ Genre seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding genres:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔒 MongoDB connection closed');
  }
}

// Run the seeder
seedGenres();
