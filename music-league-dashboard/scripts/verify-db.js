import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'music_league';

async function verifyDatabase() {
  const client = new MongoClient(MONGODB_URL);

  try {
    console.log(`Connecting to: ${MONGODB_URL}`);

    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');

    const db = client.db(DB_NAME);

    // Check collections
    console.log('📊 Collection Statistics:');
    console.log('─'.repeat(50));

    const collections = ['leagues', 'competitors', 'rounds', 'submissions', 'votes'];

    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`${collectionName.padEnd(15)} │ ${count.toString().padStart(6)} documents`);
    }

    console.log('─'.repeat(50));

    // Get leagues info
    console.log('\n🏆 Leagues:');
    const leagues = await db.collection('leagues').find({}).toArray();
    for (const league of leagues) {
      console.log(`  - ${league.name} (ID: ${league._id})`);

      const competitorCount = await db.collection('competitors')
        .countDocuments({ leagues: league._id });
      const roundCount = await db.collection('rounds')
        .countDocuments({ leagueId: league._id });
      const submissionCount = await db.collection('submissions')
        .countDocuments({ leagueId: league._id });
      const voteCount = await db.collection('votes')
        .countDocuments({ leagueId: league._id });

      console.log(`    Competitors: ${competitorCount}`);
      console.log(`    Rounds: ${roundCount}`);
      console.log(`    Submissions: ${submissionCount}`);
      console.log(`    Votes: ${voteCount}`);
    }

    // Sample some data
    console.log('\n📝 Sample Data:');
    console.log('─'.repeat(50));

    const sampleCompetitor = await db.collection('competitors').findOne();
    if (sampleCompetitor) {
      console.log('Sample Competitor:');
      console.log(JSON.stringify(sampleCompetitor, null, 2));
    }

    console.log('\n');

    const sampleRound = await db.collection('rounds').findOne();
    if (sampleRound) {
      console.log('Sample Round:');
      console.log(JSON.stringify(sampleRound, null, 2));
    }

    console.log('\n');

    // Check indexes
    console.log('🔑 Indexes:');
    console.log('─'.repeat(50));

    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`\n${collectionName}:`);
      for (const index of indexes) {
        const keys = Object.keys(index.key).join(', ');
        console.log(`  - ${index.name}: [${keys}]`);
      }
    }

    console.log('\n✅ Database verification complete!');
    console.log('\n💡 You can now use MongoDB queries to fetch data.');
    console.log('   See MONGODB_SETUP.md for example queries.\n');

  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('  1. Make sure MongoDB is running: docker-compose up -d');
    console.log('  2. Check if the container is healthy: docker ps');
    console.log('  3. View MongoDB logs: docker logs music-league-mongodb');
    console.log('  4. Try seeding the database: npm run seed\n');
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyDatabase();

