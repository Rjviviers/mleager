# Genre Data Guide

## ✅ Successfully Fetched!

Your database now contains:
- **584 songs** with basic metadata
- **608 artists** with genre information
- **346 artists** have at least one genre assigned by Spotify
- **262 artists** don't have genres (Spotify doesn't assign genres to all artists)

## Quick Start

### 1. View Genre Statistics
```bash
node scripts/genre-examples.js
```

This shows:
- Songs with their genres
- All metal songs
- Genre distribution chart
- Songs by specific genre
- Artists with multiple genres
- Coverage statistics

### 2. Query Examples in MongoDB

#### Get all songs with their genres:
```javascript
db.song_metadata.aggregate([
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
      genres: {
        $reduce: {
          input: '$artistDetails.genres',
          initialValue: [],
          in: { $concatArrays: ['$$value', '$$this'] }
        }
      }
    }
  }
])
```

#### Find all songs by a specific genre (e.g., "metal"):
```javascript
// Step 1: Get artist IDs with that genre
const metalArtists = db.artist_info.find(
  { genres: { $regex: /metal/i } }
).map(a => a.artistId);

// Step 2: Find songs by those artists
db.song_metadata.find({
  'artists.id': { $in: metalArtists }
})
```

#### Get genre distribution:
```javascript
db.artist_info.aggregate([
  { $unwind: '$genres' },
  { $group: { _id: '$genres', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Database Schema

### song_metadata Collection
```javascript
{
  spotifyUri: "spotify:track:...",
  name: "Song Title",
  artists: [
    {
      name: "Artist Name",
      id: "artist_id",
      uri: "spotify:artist:..."
    }
  ],
  album: {
    name: "Album Name",
    release_date: "2023-01-15",
    images: [...]
  },
  duration_ms: 234567,
  popularity: 75,  // 0-100
  explicit: false,
  spotify_url: "https://open.spotify.com/track/...",
  fetchedAt: Date,
  lastUpdated: Date
}
```

### artist_info Collection
```javascript
{
  artistId: "artist_id",
  artistUri: "spotify:artist:...",
  name: "Artist Name",
  genres: ["rock", "alternative rock"],  // May be empty []
  popularity: 85,  // 0-100
  followers: 1234567,
  images: [...],
  spotify_url: "https://open.spotify.com/artist/...",
  fetchedAt: Date,
  lastUpdated: Date
}
```

## Analytics Ideas with Genre Data

### 1. Genre Distribution Pie Chart
Show what % of songs fall into each genre category

### 2. Genre Popularity
Compare average popularity scores by genre

### 3. Round-by-Round Genre Analysis
See if certain rounds favor certain genres

### 4. Competitor Genre Preferences
What genres does each competitor tend to submit?

### 5. Genre Diversity Score
Measure how diverse the music selections are

### 6. Most Popular Artists by Genre
Top artists within each genre

### 7. Genre Timeline
How do genres distribute across release years?

### 8. Genre vs Votes
Do certain genres get more votes?

## Updating Data

### Re-fetch all genres:
```bash
node scripts/fetch-genres.js --force
```

### Fetch genres only for new artists:
```bash
node scripts/fetch-genres.js
```

## Important Notes

### Why Some Artists Don't Have Genres:
- Spotify doesn't assign genres to all artists
- Newer/smaller artists often lack genre tags
- Very niche artists may not be categorized
- This is normal and expected (~43% in your dataset)

### Genre Assignment:
- Genres are assigned to **artists**, not individual tracks
- One artist can have multiple genres
- Spotify's genre taxonomy is extensive (1000+ genres)
- Genres can be very specific (e.g., "nu metal", "progressive metalcore")

### Querying Multi-Genre Artists:
When an artist has multiple genres (e.g., ["rock", "alternative rock"]):
- Use `$in: ["rock"]` to find any artist with "rock"
- Use `$regex: /rock/i` to find genres containing "rock"
- Use `$all: ["rock", "alternative rock"]` to find artists with BOTH

## What's NOT Available (Requires Extended Quota Mode)

These features require Spotify Extended Quota Mode approval:

❌ **Audio Features** (from `/audio-features` endpoint):
- Energy, danceability, valence
- Tempo, key, mode
- Acousticness, instrumentalness
- Loudness, speechiness

If you need these, see: `SPOTIFY_QUOTA_SOLUTION.md`

## Scripts Reference

| Script | Purpose | Works Now? |
|--------|---------|-----------|
| `fetch-basic-metadata.js` | Get track names, artists, albums | ✅ Yes |
| `fetch-genres.js` | Get artist genres | ✅ Yes |
| `genre-examples.js` | Example genre queries | ✅ Yes |
| `test-spotify-api.js` | Test API access | ✅ Yes |
| `fetch-song-metadata.js` | Get audio features | ❌ Needs approval |

## Next Steps

1. **Integrate genres into your dashboard**
   - Add genre filters
   - Create genre visualizations
   - Show genre distribution charts

2. **Create genre-based analytics**
   - Genre preferences by user
   - Genre trends over time
   - Vote patterns by genre

3. **Request Extended Quota Mode** (optional)
   - For audio features like energy, danceability
   - See `SPOTIFY_QUOTA_SOLUTION.md` for details

## Troubleshooting

### "No song metadata found" error
Run this first:
```bash
node scripts/fetch-basic-metadata.js
```

### Genres not showing up
Check if artist has genres:
```bash
node -e "require('mongodb').MongoClient.connect('mongodb://admin:admin123@localhost:27017', (e,c) => {
  c.db('music_league').collection('artist_info').findOne({name: 'Artist Name'}, (e,d) => {
    console.log(d.genres);
    c.close();
  });
});"
```

### Want more detailed genres
Some artists have very specific sub-genres. Check the full genre list:
```bash
node scripts/genre-examples.js
```

