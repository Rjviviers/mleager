# Genre Seeding Guide

## Overview

This guide explains how to populate the `genres` collection and add genre information to songs in your Music League Dashboard.

## What This Script Does

The `seed-genres.js` script:

1. **Extracts unique genres** from the `artist_info` collection
2. **Creates a `genres` collection** with all unique genres and their artist counts
3. **Adds a `genre` field** to each song in `song_metadata`
4. **Selects one primary genre** for each song based on its artists
5. **Stores all genres** from the song's artists in an `allGenres` field for reference

## Prerequisites

Before running the genre seeder, make sure you have:

- ✅ MongoDB running (via Docker or locally)
- ✅ Basic data seeded (`node seed-db.js`)
- ✅ Artist genres fetched (`node scripts/fetch-genres.js`)

## Running the Genre Seeder

```bash
cd music-league-dashboard
node scripts/seed-genres.js
```

### What You'll See

The script provides detailed progress output:

```
🔗 Connecting to MongoDB...
✅ Connected successfully to MongoDB

📊 Step 1: Extracting unique genres from artist_info...
   Found 245 unique genres

🗑️  Step 2: Clearing existing genres collection...
   Dropped genres collection

💾 Step 3: Populating genres collection...
   ✅ Inserted 245 genres

   📈 Top 10 Genres:
   1. metal - 37 artists
   2. rock - 29 artists
   3. alternative metal - 20 artists
   ...

🔍 Step 4: Creating indexes on genres collection...
   ✅ Created unique index on name field

🎵 Step 5: Adding genre field to song_metadata...
   Processing 584 songs...
   ✅ Updated 450 songs with genres
   ⚠️  134 songs without genres (artists have no genre data)

🔍 Step 6: Creating index on song_metadata.genre...
   ✅ Created index on genre field

📊 Summary Statistics:
   Total Genres: 245
   Songs with Genre: 450/584 (77%)
   Songs without Genre: 134/584 (23%)

📊 Top Genres in Song Metadata:
   1. metal - 45 songs
   2. rock - 38 songs
   3. alternative rock - 25 songs
   ...

✅ Genre seeding completed successfully!

🔒 MongoDB connection closed
```

## Database Schema

### Genres Collection

```javascript
{
  _id: "metal",
  name: "metal",
  artistCount: 37,  // Number of artists with this genre
  createdAt: ISODate("2025-11-14T..."),
  lastUpdated: ISODate("2025-11-14T...")
}
```

**Indexes:**
- Unique index on `name`

### Song Metadata (Updated)

```javascript
{
  spotifyUri: "spotify:track:...",
  name: "Song Title",
  artists: [...],

  // New fields:
  genre: "metal",  // Primary genre (or null if no genres available)
  allGenres: ["metal", "thrash metal", "speed metal"],  // All genres from all artists
  genreUpdatedAt: ISODate("2025-11-14T...")
}
```

**Indexes:**
- Index on `genre` for efficient queries

## Genre Selection Logic

For each song, the script:

1. Gets all artists for the song
2. Fetches genre information for each artist from `artist_info`
3. Collects all genres from all artists
4. **Selects the first genre** as the primary genre
5. Stores all genres in `allGenres` array

### Customizing Genre Selection

You can modify the genre selection logic in `scripts/seed-genres.js`. Current options include:

```javascript
// Option 1: First genre from first artist (current)
const selectedGenre = allGenres[0];

// Option 2: Most common genre across all artists
const selectedGenre = getMostCommonGenre(allGenres);

// Option 3: Random genre
const selectedGenre = allGenres[Math.floor(Math.random() * allGenres.length)];

// Option 4: Genre from most popular artist
const selectedGenre = getGenreFromMostPopularArtist(artistsInfo);
```

## Usage Examples

### MongoDB Queries

#### Get all genres sorted by artist count
```javascript
db.genres.find().sort({ artistCount: -1 })
```

#### Get all songs with a specific genre
```javascript
db.song_metadata.find({ genre: "metal" })
```

#### Get genre distribution
```javascript
db.song_metadata.aggregate([
  { $match: { genre: { $ne: null } } },
  { $group: { _id: "$genre", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

#### Get songs with multiple genres (from allGenres)
```javascript
db.song_metadata.find({
  allGenres: { $size: { $gt: 1 } }
})
```

### Using MongoDB Utility Functions

The updated `src/utils/mongodb.js` provides convenience functions:

```javascript
import {
  getAllGenres,
  getGenreByName,
  getSongsByGenre,
  getGenreDistribution,
  getGenresByCompetitor
} from './utils/mongodb.js';

// Get all genres
const genres = await getAllGenres();

// Get songs by genre
const metalSongs = await getSongsByGenre('metal', leagueId);

// Get genre distribution for a league
const distribution = await getGenreDistribution(leagueId);

// Get a competitor's genre preferences
const competitorGenres = await getGenresByCompetitor(competitorId, leagueId);
```

## Re-running the Script

You can safely re-run the script at any time. It will:

1. Drop the existing `genres` collection
2. Re-create it from current `artist_info` data
3. Update the `genre` field for all songs

This is useful if you:
- Fetch new artist information
- Want to change the genre selection logic
- Need to update outdated genre data

## Troubleshooting

### "No genres found"

This means no artists in your `artist_info` collection have genre data. Run:

```bash
node scripts/fetch-genres.js
```

### "Connection refused"

Make sure MongoDB is running:

```bash
docker-compose up -d
```

### "Authentication failed"

Check your `.env` file has the correct MongoDB credentials:

```env
MONGODB_URL=mongodb://admin:admin123@localhost:27017
```

## Analytics Ideas

With genres populated, you can now analyze:

- **Genre popularity**: Which genres get the most votes?
- **Genre diversity**: How diverse are the submissions?
- **Competitor preferences**: What genres does each person favor?
- **Round trends**: Do certain rounds favor certain genres?
- **Genre vs popularity**: Do popular genres correlate with Spotify popularity?
- **Genre timeline**: How do genres distribute across release years?

## Next Steps

After seeding genres, consider:

1. **Building genre visualizations** in your dashboard
2. **Adding genre filters** to song tables
3. **Creating genre-based analytics** components
4. **Implementing genre recommendations** based on voting patterns

See `src/utils/mongodb.js` for available genre query functions.

