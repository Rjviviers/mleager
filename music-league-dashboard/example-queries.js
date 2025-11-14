// Example MongoDB Queries for Music League Dashboard
// Run this file with: node example-queries.js

import { MongoClient } from 'mongodb';

const MONGODB_URL = 'mongodb://admin:admin123@localhost:27017';
const DB_NAME = 'music_league';

async function runExamples() {
  const client = new MongoClient(MONGODB_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('🎵 Music League Dashboard - Example Queries\n');
    console.log('='.repeat(60));

    // Example 1: Get all leagues
    console.log('\n📊 Example 1: Get All Leagues');
    console.log('-'.repeat(60));
    const leagues = await db.collection('leagues').find().toArray();
    console.log(JSON.stringify(leagues, null, 2));

    // Example 2: Get competitors in multiple leagues
    console.log('\n\n👥 Example 2: Competitors in Both Leagues');
    console.log('-'.repeat(60));
    const multiLeagueCompetitors = await db.collection('competitors')
      .find({ leagues: { $size: 2 } })
      .limit(5)
      .toArray();
    console.log(`Found ${multiLeagueCompetitors.length} competitors in both leagues:`);
    multiLeagueCompetitors.forEach(comp => {
      console.log(`  - ${comp.name} (${comp._id})`);
    });

    // Example 3: Get recent rounds
    console.log('\n\n🎯 Example 3: Most Recent Rounds');
    console.log('-'.repeat(60));
    const recentRounds = await db.collection('rounds')
      .find()
      .sort({ created: -1 })
      .limit(5)
      .toArray();
    recentRounds.forEach(round => {
      console.log(`  ${round.created.toISOString().split('T')[0]} - ${round.name}`);
    });

    // Example 4: Top voted submission in a round
    console.log('\n\n🏆 Example 4: Top Submission in First Round');
    console.log('-'.repeat(60));
    const firstRound = await db.collection('rounds')
      .find()
      .sort({ created: 1 })
      .limit(1)
      .toArray();

    if (firstRound.length > 0) {
      const topSubmissions = await db.collection('votes').aggregate([
        { $match: { roundId: firstRound[0]._id } },
        {
          $group: {
            _id: '$spotifyUri',
            totalPoints: { $sum: '$pointsAssigned' },
            voteCount: { $sum: 1 }
          }
        },
        { $sort: { totalPoints: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: 'submissions',
            localField: '_id',
            foreignField: 'spotifyUri',
            as: 'submission'
          }
        },
        { $unwind: '$submission' }
      ]).toArray();

      console.log(`Top submissions for "${firstRound[0].name}":`);
      topSubmissions.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.submission.title}" by ${item.submission.artists}`);
        console.log(`     Points: ${item.totalPoints}, Votes: ${item.voteCount}`);
      });
    }

    // Example 5: Competitor statistics
    console.log('\n\n📈 Example 5: Competitor Statistics');
    console.log('-'.repeat(60));
    const competitor = await db.collection('competitors').findOne();

    if (competitor) {
      // Count submissions
      const submissionCount = await db.collection('submissions')
        .countDocuments({ submitterId: competitor._id });

      // Get submissions
      const submissions = await db.collection('submissions')
        .find({ submitterId: competitor._id })
        .toArray();

      // Count votes received
      const spotifyUris = submissions.map(s => s.spotifyUri);
      const votesReceived = await db.collection('votes')
        .find({ spotifyUri: { $in: spotifyUris } })
        .toArray();

      const totalPointsReceived = votesReceived.reduce((sum, vote) =>
        sum + vote.pointsAssigned, 0
      );

      console.log(`Stats for ${competitor.name}:`);
      console.log(`  Submissions: ${submissionCount}`);
      console.log(`  Total Votes Received: ${votesReceived.length}`);
      console.log(`  Total Points Received: ${totalPointsReceived}`);
    }

    // Example 6: League activity summary
    console.log('\n\n🎮 Example 6: League Activity Summary');
    console.log('-'.repeat(60));
    for (const league of leagues) {
      const stats = {
        competitors: await db.collection('competitors')
          .countDocuments({ leagues: league._id }),
        rounds: await db.collection('rounds')
          .countDocuments({ leagueId: league._id }),
        submissions: await db.collection('submissions')
          .countDocuments({ leagueId: league._id }),
        votes: await db.collection('votes')
          .countDocuments({ leagueId: league._id })
      };

      console.log(`\n${league.name}:`);
      console.log(`  Competitors: ${stats.competitors}`);
      console.log(`  Rounds: ${stats.rounds}`);
      console.log(`  Submissions: ${stats.submissions}`);
      console.log(`  Votes: ${stats.votes}`);
      console.log(`  Avg submissions/round: ${(stats.submissions / stats.rounds).toFixed(1)}`);
      console.log(`  Avg votes/round: ${(stats.votes / stats.rounds).toFixed(1)}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Explore more queries in MONGODB_SETUP.md!');

  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    await client.close();
  }
}

runExamples();

