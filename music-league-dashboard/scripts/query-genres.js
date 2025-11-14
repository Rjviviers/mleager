import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = 'music_league';

/**
 * Example queries for genres collection and song genres
 */
async function queryGenres() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await client.connect();

    const db = client.db(DB_NAME);

    // Example 1: Get all genres sorted by artist count
    console.log('📊 Example 1: Top 10 Genres by Artist Count');
    console.log('═'.repeat(60));
    const topGenres = await db.collection('genres')
      .find({})
      .sort({ artistCount: -1 })
      .limit(10)
      .toArray();

    topGenres.forEach((genre, index) => {
      console.log(`${index + 1}. ${genre.name.padEnd(30)} - ${genre.artistCount} artists`);
    });

    // Example 2: Get songs by a specific genre
    console.log('\n\n🎵 Example 2: Songs with "rock" genre');
    console.log('═'.repeat(60));
    const rockSongs = await db.collection('song_metadata')
      .find({ genre: 'rock' })
      .limit(5)
      .toArray();

    if (rockSongs.length > 0) {
      rockSongs.forEach((song, index) => {
        const artistNames = song.artists?.map(a => a.name).join(', ') || 'Unknown';
        console.log(`${index + 1}. "${song.name}" by ${artistNames}`);
        if (song.allGenres && song.allGenres.length > 1) {
          console.log(`   All genres: ${song.allGenres.join(', ')}`);
        }
      });
    } else {
      console.log('No rock songs found.');
    }

    // Example 3: Genre distribution in song_metadata
    console.log('\n\n📈 Example 3: Genre Distribution in Songs');
    console.log('═'.repeat(60));
    const genreDistribution = await db.collection('song_metadata').aggregate([
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

    genreDistribution.forEach((item, index) => {
      console.log(`${index + 1}. ${item._id.padEnd(30)} - ${item.count} songs`);
    });

    // Example 4: Songs with multiple genres
    console.log('\n\n🎭 Example 4: Songs with Multiple Genres (first 5)');
    console.log('═'.repeat(60));
    const multiGenreSongs = await db.collection('song_metadata')
      .find({
        allGenres: { $exists: true },
        $expr: { $gt: [{ $size: '$allGenres' }, 1] }
      })
      .limit(5)
      .toArray();

    if (multiGenreSongs.length > 0) {
      multiGenreSongs.forEach((song, index) => {
        const artistNames = song.artists?.map(a => a.name).join(', ') || 'Unknown';
        console.log(`${index + 1}. "${song.name}" by ${artistNames}`);
        console.log(`   Primary: ${song.genre}`);
        console.log(`   All: ${song.allGenres.join(', ')}`);
      });
    } else {
      console.log('No multi-genre songs found.');
    }

    // Example 5: Songs without genres
    console.log('\n\n⚠️  Example 5: Songs Without Genres');
    console.log('═'.repeat(60));
    const noGenreCount = await db.collection('song_metadata')
      .countDocuments({ genre: null });
    const totalSongs = await db.collection('song_metadata').countDocuments();
    const withGenreCount = totalSongs - noGenreCount;

    console.log(`Songs with genre:    ${withGenreCount}/${totalSongs} (${Math.round(withGenreCount/totalSongs*100)}%)`);
    console.log(`Songs without genre: ${noGenreCount}/${totalSongs} (${Math.round(noGenreCount/totalSongs*100)}%)`);

    // Show a few examples of songs without genres
    const noGenreSongs = await db.collection('song_metadata')
      .find({ genre: null })
      .limit(3)
      .toArray();

    if (noGenreSongs.length > 0) {
      console.log('\nExamples:');
      noGenreSongs.forEach((song, index) => {
        const artistNames = song.artists?.map(a => a.name).join(', ') || 'Unknown';
        console.log(`${index + 1}. "${song.name}" by ${artistNames}`);
      });
    }

    // Example 6: Genre popularity correlation
    console.log('\n\n⭐ Example 6: Genre vs Spotify Popularity (Top 5 Genres)');
    console.log('═'.repeat(60));
    const genrePopularity = await db.collection('song_metadata').aggregate([
      { $match: { genre: { $ne: null }, popularity: { $exists: true } } },
      {
        $group: {
          _id: '$genre',
          avgPopularity: { $avg: '$popularity' },
          songCount: { $sum: 1 }
        }
      },
      { $sort: { avgPopularity: -1 } },
      { $limit: 5 }
    ]).toArray();

    genrePopularity.forEach((item, index) => {
      console.log(`${index + 1}. ${item._id.padEnd(30)} - Avg: ${item.avgPopularity.toFixed(1)} (${item.songCount} songs)`);
    });

    // Example 7: Songs by genre and league
    console.log('\n\n🏆 Example 7: Genre Distribution by League');
    console.log('═'.repeat(60));

    const leagues = await db.collection('leagues').find({}).toArray();

    for (const league of leagues) {
      console.log(`\n${league.name} (ID: ${league._id}):`);

      const leagueGenres = await db.collection('submissions').aggregate([
        { $match: { leagueId: league._id } },
        {
          $lookup: {
            from: 'song_metadata',
            localField: 'spotifyUri',
            foreignField: 'spotifyUri',
            as: 'metadata'
          }
        },
        { $unwind: '$metadata' },
        { $match: { 'metadata.genre': { $ne: null } } },
        {
          $group: {
            _id: '$metadata.genre',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();

      if (leagueGenres.length > 0) {
        leagueGenres.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item._id.padEnd(28)} - ${item.count} songs`);
        });
      } else {
        console.log('  No genre data available for this league.');
      }
    }

    // Example 8: Search for songs by genre pattern
    console.log('\n\n🔍 Example 8: Search Genres by Pattern (contains "metal")');
    console.log('═'.repeat(60));
    const metalGenres = await db.collection('genres')
      .find({ name: { $regex: /metal/i } })
      .sort({ artistCount: -1 })
      .limit(10)
      .toArray();

    metalGenres.forEach((genre, index) => {
      console.log(`${index + 1}. ${genre.name.padEnd(30)} - ${genre.artistCount} artists`);
    });

    console.log('\n✅ Query examples completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the queries
queryGenres();

