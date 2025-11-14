// MongoDB initialization script
// This runs when the MongoDB container is first created

db = db.getSiblingDB('music_league');

// Create collections
db.createCollection('leagues');
db.createCollection('competitors');
db.createCollection('rounds');
db.createCollection('submissions');
db.createCollection('votes');

// Create indexes for better query performance
db.competitors.createIndex({ leagueId: 1 });
db.competitors.createIndex({ name: 1 });

db.rounds.createIndex({ leagueId: 1 });
db.rounds.createIndex({ created: -1 });

db.submissions.createIndex({ leagueId: 1, roundId: 1 });
db.submissions.createIndex({ submitterId: 1 });
db.submissions.createIndex({ spotifyUri: 1 });

db.votes.createIndex({ leagueId: 1, roundId: 1 });
db.votes.createIndex({ voterId: 1 });
db.votes.createIndex({ spotifyUri: 1 });

print('MongoDB initialized successfully with collections and indexes');

