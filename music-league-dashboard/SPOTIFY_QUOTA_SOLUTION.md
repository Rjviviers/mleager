# Spotify API 403 Error - Extended Quota Mode Required

## Problem
The Spotify `/audio-features` endpoint returns a **403 Forbidden** error because your app is in **Development Mode** and needs **Extended Quota Mode** approval.

## What Works vs What Doesn't

### ✅ Works in Development Mode:
- `/tracks` - Basic track information
- `/search` - Search for tracks, artists, albums
- `/artists` - Artist information
- `/albums` - Album information

### ❌ Requires Extended Quota Mode:
- `/audio-features` - Audio analysis (energy, danceability, valence, etc.)
- `/recommendations` - Track recommendations
- High-volume requests (>100k per month)

## Solution 1: Request Extended Quota Mode (Recommended)

### Steps:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app (Client ID: `dda52da1...`)
3. Navigate to **"Settings"**
4. Look for **"Quota Extension"** or **"Request Extension"**
5. Fill out the extension request form

### What to Include in Your Request:
```
Project Name: Music League Dashboard
Description: An analytics dashboard for Music League competitions that
analyzes song submissions, voting patterns, and music trends. The app
uses audio features to provide insights into musical preferences and
create data visualizations.

Expected Monthly Users: [Your number]
Expected API Calls: ~1000-5000 per month (analyzing 500-1000 songs)
Use Case: Personal/Educational analytics project
```

### Processing Time:
- Usually takes **3-7 business days**
- You'll receive an email when approved
- Some projects may require additional information

## Solution 2: Use Basic Metadata (Immediate Workaround)

While waiting for quota approval, use basic track metadata instead of audio features.

### Available Scripts:

#### 1. Fetch Basic Metadata (Works Now)
```bash
# Fetch basic track info for all songs
node scripts/fetch-basic-metadata.js

# Options:
node scripts/fetch-basic-metadata.js --limit 50    # Test with 50 songs
node scripts/fetch-basic-metadata.js --force       # Re-fetch existing data
```

**Basic metadata includes:**
- Track name, artists, album
- Release date, duration
- Popularity score (0-100)
- Album artwork
- Preview URL
- Explicit flag

#### 2. Fetch Audio Features (Requires Approval)
```bash
# Once you have Extended Quota Mode:
node scripts/fetch-song-metadata.js
```

**Audio features include:**
- Energy, danceability, valence
- Acousticness, instrumentalness
- Tempo, key, mode
- Loudness, speechiness, liveness

## Comparison: Basic vs Audio Features

### Basic Metadata
```json
{
  "name": "Song Title",
  "artists": [{"name": "Artist Name"}],
  "album": "Album Name",
  "release_date": "2023-01-15",
  "duration_ms": 234567,
  "popularity": 75,
  "explicit": false
}
```

### Audio Features
```json
{
  "energy": 0.789,
  "danceability": 0.654,
  "valence": 0.432,
  "tempo": 128.5,
  "key": 5,
  "mode": 1,
  "acousticness": 0.123,
  "instrumentalness": 0.001
}
```

## What Can You Do Without Audio Features?

You can still build meaningful analytics:

### ✅ Available Insights:
- **Popularity trends** - Which songs/artists are most popular
- **Artist diversity** - Variety of artists in submissions
- **Temporal analysis** - Songs by release year/decade
- **Explicit content** - Track explicit content patterns
- **Duration analysis** - Song length preferences
- **Album art gallery** - Visual display of submissions
- **Artist/genre clustering** - Based on artist metadata

### ❌ Requires Audio Features:
- Musical mood analysis (valence, energy)
- Danceability metrics
- Acousticness/instrumentalness
- Tempo/key analysis
- "Vibes" clustering

## Recommended Approach

1. **Immediately**: Run `fetch-basic-metadata.js` to populate basic info
2. **Request** Extended Quota Mode from Spotify
3. **Wait** for approval (3-7 days)
4. **Run** `fetch-song-metadata.js` to add audio features
5. **Enjoy** full analytics capabilities!

## Alternative: Use Pre-computed Datasets

If you don't want to wait:
- Consider using public datasets like Million Song Dataset
- Use alternative APIs (Last.fm, MusicBrainz)
- Manual data entry for small datasets

## Troubleshooting

### Still getting 403 after approval?
- Check that you're using the same app credentials
- Verify your app status in the dashboard
- Try re-authenticating (the token caches)

### Rate limiting (429 errors)?
- Add delays between requests (already implemented)
- Reduce batch sizes
- Implement exponential backoff

### Other errors?
```bash
# Run diagnostics
node scripts/test-spotify-api.js
```

## Resources

- [Spotify API Documentation](https://developer.spotify.com/documentation/web-api)
- [Quota Extension Guidelines](https://developer.spotify.com/documentation/web-api/concepts/quota-modes)
- [Audio Features Reference](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)

