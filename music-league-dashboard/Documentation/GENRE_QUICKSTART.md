# Genre Analytics - Quick Start Guide

## Overview

Your Music League Dashboard now has a comprehensive genre classification system! 🎭

## What's New

### 1. Genres Collection
A new MongoDB collection that stores all unique genres with metadata:
- Genre name
- Number of artists with this genre
- Timestamps

### 2. Song Genre Field
Every song in `song_metadata` now has:
- `genre` - The primary genre for the song
- `allGenres` - All genres from all artists of the song
- `genreUpdatedAt` - When the genre was last updated

### 3. Helper Functions
New MongoDB utility functions for querying genres:
- `getAllGenres()` - Get all genres sorted by artist count
- `getSongsByGenre(genreName, leagueId)` - Find songs by genre
- `getGenreDistribution(leagueId)` - Get genre distribution
- `getGenresByCompetitor(competitorId, leagueId)` - Get competitor's genre preferences

## Quick Setup (3 Steps)

### Step 1: Ensure Artist Genres Are Fetched

```bash
cd music-league-dashboard
node scripts/fetch-genres.js
```

This fetches genre information for all artists from Spotify.

### Step 2: Run the Genre Seeder

```bash
node scripts/seed-genres.js
```

This will:
- Create the `genres` collection
- Add genre fields to all songs
- Create necessary indexes

### Step 3: Verify the Data

```bash
node scripts/query-genres.js
```

This runs example queries to show you what's available.

## Example Output

When you run `seed-genres.js`, you'll see:

```
📊 Step 1: Extracting unique genres from artist_info...
   Found 245 unique genres

💾 Step 3: Populating genres collection...
   ✅ Inserted 245 genres

   📈 Top 10 Genres:
   1. metal - 37 artists
   2. rock - 29 artists
   3. alternative metal - 20 artists
   ...

🎵 Step 5: Adding genre field to song_metadata...
   ✅ Updated 450 songs with genres
   ⚠️  134 songs without genres

📊 Summary Statistics:
   Total Genres: 245
   Songs with Genre: 450/584 (77%)
   Songs without Genre: 134/584 (23%)
```

## What Can You Do Now?

### 1. Analyze Genre Trends
Find out which genres dominate your music league:

```javascript
// MongoDB query
db.song_metadata.aggregate([
  { $match: { genre: { $ne: null } } },
  { $group: { _id: "$genre", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### 2. Find Songs by Genre
Get all metal songs:

```javascript
db.song_metadata.find({ genre: "metal" })
```

### 3. Analyze Competitor Preferences
See what genres each competitor prefers:

```javascript
// Using helper function
const genres = await getGenresByCompetitor("competitor123", 1);
```

### 4. Genre vs Votes Analysis
See which genres get the most votes (coming soon to the dashboard!).

### 5. Round-by-Round Genre Analysis
Track how genres change across different rounds.

## Data Structure

### Genres Collection
```javascript
{
  _id: "metal",
  name: "metal",
  artistCount: 37,
  createdAt: ISODate("..."),
  lastUpdated: ISODate("...")
}
```

### Song Metadata (Updated)
```javascript
{
  spotifyUri: "spotify:track:...",
  name: "Master of Puppets",
  artists: [...],
  genre: "thrash metal",              // Primary genre
  allGenres: ["thrash metal", "metal", "speed metal"],  // All genres
  genreUpdatedAt: ISODate("...")
}
```

## Common Queries

### Top 10 Genres
```javascript
db.genres.find().sort({ artistCount: -1 }).limit(10)
```

### Songs with Multiple Genres
```javascript
db.song_metadata.find({
  $expr: { $gt: [{ $size: "$allGenres" }, 1] }
})
```

### Genre Distribution for League 1
```javascript
// Using helper function
const distribution = await getGenreDistribution(1);
```

### Find All Metal-Related Genres
```javascript
db.genres.find({ name: { $regex: /metal/i } })
```

## Customization

### Change Genre Selection Logic

Edit `scripts/seed-genres.js` around line 77:

```javascript
// Current: First genre from artists
const selectedGenre = allGenres[0];

// Option: Most common genre
const selectedGenre = getMostCommonGenre(allGenres);

// Option: Random genre
const selectedGenre = allGenres[Math.floor(Math.random() * allGenres.length)];
```

### Re-run After Changes

You can safely re-run the seeder anytime:

```bash
node scripts/seed-genres.js
```

It will clear and repopulate all genre data.

## Next Steps

### For Dashboard Development:

1. **Genre Filter Component**
   - Add genre dropdown to song tables
   - Filter analytics by genre

2. **Genre Analytics Page**
   - Genre distribution pie chart
   - Genre popularity trends
   - Genre vs votes correlation

3. **Competitor Genre Profile**
   - Show favorite genres per competitor
   - Genre diversity score

4. **Round Genre Analysis**
   - See dominant genre per round
   - Track genre trends over time

## Troubleshooting

### "No genres found"
Run `node scripts/fetch-genres.js` first to get artist genre data from Spotify.

### "Connection refused"
Start MongoDB: `docker-compose up -d mongodb`

### "Not all songs have genres"
This is normal! Not all artists on Spotify have genre tags (~23% in your dataset).

## Documentation

For more details, see:
- [GENRE_SEEDING.md](GENRE_SEEDING.md) - Complete guide
- [GENRE_GUIDE.md](GENRE_GUIDE.md) - Artist genres from Spotify
- [src/utils/mongodb.js](src/utils/mongodb.js) - Helper functions

## Questions?

The genre system is designed to be flexible and extensible. Feel free to modify the selection logic or add new fields as needed!

---

**Created:** 2025-11-14
**Database Collections:** `genres`, `song_metadata` (updated)
**Helper Functions:** In `src/utils/mongodb.js`
**Example Queries:** Run `node scripts/query-genres.js`

