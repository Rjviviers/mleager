import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = 'music_league';

/**
 * Seed the genres collection and add genre field to song_metadata
 */
async function seedGenres() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully to MongoDB');

    const db = client.db(DB_NAME);

    // Step 1: Extract all unique genres from artist_info collection
    console.log('\n📊 Step 1: Extracting unique genres from artist_info...');

    const genreAggregation = await db.collection('artist_info').aggregate([
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
    ]).toArray();

    console.log(`   Found ${genreAggregation.length} unique genres`);

    // Step 2: Clear and populate the genres collection
    console.log('\n🗑️  Step 2: Clearing existing genres collection...');
    try {
      await db.collection('genres').drop();
      console.log('   Dropped genres collection');
    } catch (error) {
      if (error.code === 26) {
        console.log('   Genres collection doesn\'t exist, skipping...');
      } else {
        throw error;
      }
    }

    if (genreAggregation.length > 0) {
      console.log('\n💾 Step 3: Populating genres collection...');

      const genreDocs = genreAggregation.map(genre => ({
        _id: genre._id,
        name: genre._id,
        artistCount: genre.count,
        createdAt: new Date(),
        lastUpdated: new Date()
      }));

      await db.collection('genres').insertMany(genreDocs);
      console.log(`   ✅ Inserted ${genreDocs.length} genres`);

      // Display top 10 genres
      console.log('\n   📈 Top 10 Genres:');
      genreDocs.slice(0, 10).forEach((genre, index) => {
        console.log(`   ${index + 1}. ${genre.name} - ${genre.artistCount} artists`);
      });
    }

    // Step 4: Create index on genres collection
    console.log('\n🔍 Step 4: Creating indexes on genres collection...');
    await db.collection('genres').createIndex({ name: 1 }, { unique: true });
    console.log('   ✅ Created unique index on name field');

    // Step 5: Add genre field to song_metadata
    console.log('\n🎵 Step 5: Adding genre field to song_metadata...');

    const songMetadata = await db.collection('song_metadata').find({}).toArray();
    console.log(`   Processing ${songMetadata.length} songs...`);

    let updatedCount = 0;
    let noGenreCount = 0;

    for (const song of songMetadata) {
      if (!song.artists || song.artists.length === 0) {
        noGenreCount++;
        continue;
      }

      // Get all artist IDs for this song
      const artistIds = song.artists.map(artist => artist.id);

      // Find artist info for these artists
      const artistsInfo = await db.collection('artist_info').find({
        artistId: { $in: artistIds }
      }).toArray();

      // Collect all genres from all artists
      const allGenres = [];
      for (const artist of artistsInfo) {
        if (artist.genres && artist.genres.length > 0) {
          allGenres.push(...artist.genres);
        }
      }

      if (allGenres.length > 0) {
        // Select the first genre (you can modify this logic)
        // Options for selection:
        // 1. First genre from first artist (current implementation)
        // 2. Most common genre across all artists
        // 3. Random genre
        // 4. Genre from most popular artist

        const selectedGenre = allGenres[0];

        // Update the song_metadata document
        await db.collection('song_metadata').updateOne(
          { spotifyUri: song.spotifyUri },
          {
            $set: {
              genre: selectedGenre,
              allGenres: allGenres,  // Store all genres for reference
              genreUpdatedAt: new Date()
            }
          }
        );

        updatedCount++;
      } else {
        noGenreCount++;

        // Set genre to null if no genres found
        await db.collection('song_metadata').updateOne(
          { spotifyUri: song.spotifyUri },
          {
            $set: {
              genre: null,
              allGenres: [],
              genreUpdatedAt: new Date()
            }
          }
        );
      }
    }

    console.log(`   ✅ Updated ${updatedCount} songs with genres`);
    console.log(`   ⚠️  ${noGenreCount} songs without genres (artists have no genre data)`);

    // Step 6: Create index on song_metadata.genre
    console.log('\n🔍 Step 6: Creating index on song_metadata.genre...');
    await db.collection('song_metadata').createIndex({ genre: 1 });
    console.log('   ✅ Created index on genre field');

    // Step 7: Print summary statistics
    console.log('\n📊 Summary Statistics:');

    const genreCount = await db.collection('genres').countDocuments();
    const songsWithGenre = await db.collection('song_metadata').countDocuments({ genre: { $ne: null } });
    const songsWithoutGenre = await db.collection('song_metadata').countDocuments({ genre: null });
    const totalSongs = await db.collection('song_metadata').countDocuments();

    console.log(`   Total Genres: ${genreCount}`);
    console.log(`   Songs with Genre: ${songsWithGenre}/${totalSongs} (${Math.round(songsWithGenre/totalSongs*100)}%)`);
    console.log(`   Songs without Genre: ${songsWithoutGenre}/${totalSongs} (${Math.round(songsWithoutGenre/totalSongs*100)}%)`);

    // Step 8: Show genre distribution in songs
    console.log('\n📊 Top Genres in Song Metadata:');
    const songGenreDistribution = await db.collection('song_metadata').aggregate([
      { $match: { genre: { $ne: null } } },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    songGenreDistribution.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item._id} - ${item.count} songs`);
    });

    console.log('\n✅ Genre seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding genres:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔒 MongoDB connection closed');
  }
}

// Run the seeder
seedGenres();

