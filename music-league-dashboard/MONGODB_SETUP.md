# MongoDB Setup Guide

This guide explains how to set up and use MongoDB for the Music League Dashboard project.

## Quick Start

### 1. Start MongoDB with Docker

```bash
# Start MongoDB and the dashboard
# Use 'docker-compose' (v1) or 'docker compose' (v2) depending on your installation
docker compose up -d
# OR
docker-compose up -d

# Check if MongoDB is running
docker ps
```

MongoDB will be accessible at `localhost:27017` with:
- **Username**: `admin`
- **Password**: `admin123`
- **Database**: `music_league`

### 2. Install Dependencies

```bash
npm install
```

### 3. Seed the Database

Run the seeding script to import all CSV data into MongoDB:

```bash
npm run seed
```

This will:
- Connect to MongoDB
- Clear existing collections (if any)
- Import data from both League 1 and League 2
- Create appropriate indexes
- Display a summary of imported data

## Database Schema

### Collections

#### `leagues`
```javascript
{
  _id: Number,           // League ID (1, 2, etc.)
  name: String,          // League name
  createdAt: Date        // Creation timestamp
}
```

#### `competitors`
```javascript
{
  _id: String,           // Original competitor ID from CSV
  name: String,          // Competitor name
  leagues: [Number]      // Array of league IDs (competitors can be in multiple leagues)
}
```

#### `rounds`
```javascript
{
  _id: String,           // Original round ID from CSV
  name: String,          // Round name
  description: String,   // Round description
  playlistUrl: String,   // Spotify playlist URL
  created: Date,         // Round creation date
  leagueId: Number       // Reference to league
}
```

#### `submissions`
```javascript
{
  spotifyUri: String,    // Spotify track URI
  title: String,         // Song title
  album: String,         // Album name
  artists: String,       // Artist(s) name
  submitterId: String,   // Reference to competitor
  created: Date,         // Submission timestamp
  comment: String,       // Submission comment
  roundId: String,       // Reference to round
  visibleToVoters: String, // Visibility status
  leagueId: Number       // Reference to league
}
```

#### `votes`
```javascript
{
  spotifyUri: String,    // Spotify track URI (what was voted for)
  voterId: String,       // Reference to competitor (who voted)
  created: Date,         // Vote timestamp
  pointsAssigned: Number,// Points given
  comment: String,       // Vote comment
  roundId: String,       // Reference to round
  leagueId: Number       // Reference to league
}
```

## Useful MongoDB Commands

### Connect to MongoDB CLI

```bash
# Via Docker
docker exec -it music-league-mongodb mongosh -u admin -p admin123

# Direct connection (if MongoDB is running locally)
mongosh "mongodb://admin:admin123@localhost:27017"
```

### Query Examples

```javascript
// Switch to the music_league database
use music_league

// Count documents in each collection
db.leagues.countDocuments()
db.competitors.countDocuments()
db.rounds.countDocuments()
db.submissions.countDocuments()
db.votes.countDocuments()

// Get all leagues
db.leagues.find()

// Get competitors from League 1
db.competitors.find({ leagues: 1 })

// Get all rounds sorted by date
db.rounds.find().sort({ created: -1 })

// Get submissions for a specific round
db.submissions.find({ roundId: "ROUND_ID_HERE" })

// Get all votes for a specific voter
db.votes.find({ voterId: "VOTER_ID_HERE" })

// Calculate total points for each submission in a round
db.votes.aggregate([
  { $match: { roundId: "ROUND_ID_HERE" } },
  {
    $group: {
      _id: "$spotifyUri",
      totalPoints: { $sum: "$pointsAssigned" },
      voteCount: { $sum: 1 }
    }
  },
  { $sort: { totalPoints: -1 } }
])

// Get top competitors by total votes received
db.votes.aggregate([
  {
    $lookup: {
      from: "submissions",
      localField: "spotifyUri",
      foreignField: "spotifyUri",
      as: "submission"
    }
  },
  { $unwind: "$submission" },
  {
    $group: {
      _id: "$submission.submitterId",
      totalPoints: { $sum: "$pointsAssigned" },
      totalVotes: { $sum: 1 }
    }
  },
  { $sort: { totalPoints: -1 } },
  { $limit: 10 }
])
```

## Stopping and Cleaning Up

```bash
# Stop containers (use 'docker compose' or 'docker-compose' depending on your version)
docker compose down

# Stop and remove volumes (WARNING: This deletes all data!)
docker compose down -v

# Re-seed after cleanup
docker compose up -d
npm run seed
```

## Troubleshooting

### Connection Refused

If you get a connection error:
1. Check if MongoDB is running: `docker ps`
2. Ensure port 27017 is not in use: `lsof -i :27017`
3. Restart the containers: `docker compose restart`

### Authentication Failed

If authentication fails:
1. Stop containers: `docker compose down -v`
2. Remove the volume to reset: This clears the database
3. Start fresh: `docker compose up -d`

### Seeding Errors

If seeding fails:
1. Check MongoDB is accessible: `docker logs music-league-mongodb`
2. Verify CSV files exist in `public/data/`
3. Check the MongoDB connection URL in the seed script

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Customize the MongoDB connection string if needed:

```
MONGODB_URL=mongodb://admin:admin123@localhost:27017
MONGODB_DB_NAME=music_league
```

For Docker environment, use the service name:
```
MONGODB_URL=mongodb://admin:admin123@mongodb:27017
```

## Next Steps

After setting up MongoDB, you can:
1. Build a backend API to serve data from MongoDB
2. Update the frontend to fetch data from the API instead of CSV files
3. Add real-time features using MongoDB change streams
4. Implement data analytics and aggregation queries

