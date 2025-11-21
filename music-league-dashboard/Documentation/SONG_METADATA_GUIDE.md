# Song Metadata & Audio Features Guide

This guide explains how to use the new song metadata and audio features analysis capabilities in the Music League Dashboard.

## Overview

The dashboard now integrates with Spotify's Web API to fetch and analyze audio features for all songs in your leagues. This allows you to discover what types of music perform best in voting, including:

- **Energy**: How intense and energetic a song is (0-100%)
- **Danceability**: How suitable a song is for dancing (0-100%)
- **Valence**: Musical positivity/happiness (0-100%)
- **Acousticness**: Confidence that the track is acoustic (0-100%)
- **Instrumentalness**: Likelihood the track contains no vocals (0-100%)
- **Speechiness**: Presence of spoken words (0-100%)
- **Tempo**: Beats per minute (BPM)
- **Key**: Musical key (0-11, representing C, C#, D, etc.)
- **Mode**: Major (1) or Minor (0)
- **Loudness**: Overall loudness in decibels
- **Duration**: Track length in milliseconds

## Setup

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - App name: "Music League Dashboard" (or any name)
   - App description: "Analytics dashboard for Music League data"
   - Redirect URI: http://localhost:3000 (not used, but required)
5. Accept the terms and click "Create"
6. On your app page, click "Settings"
7. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

1. Copy the `.env.template` file to `.env`:
   ```bash
   cp env.template .env
   ```

2. Edit `.env` and add your Spotify credentials:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

## Usage

### Option 1: Seed Database with Metadata (Recommended)

When seeding your database, metadata is automatically fetched:

```bash
npm run seed
```

This will:
1. Seed all league data (competitors, rounds, submissions, votes)
2. Automatically fetch audio features from Spotify for all songs
3. Store metadata in the `song_metadata` collection

To skip metadata fetching (faster seeding for testing):

```bash
npm run seed:skip-metadata
```

### Option 2: Backfill Metadata for Existing Data

If you already have data seeded and want to add metadata:

```bash
npm run fetch-metadata
```

This script:
- Fetches metadata for all songs that don't have it yet
- Handles rate limiting automatically
- Shows progress as it runs
- Can resume from failures

**Advanced options:**

```bash
# Re-fetch metadata even if it already exists
npm run fetch-metadata -- --force

# Only fetch metadata for first 50 songs (for testing)
npm run fetch-metadata -- --limit 50
```

### Option 3: Export Metadata to CSV (For Frontend)

After fetching metadata, export it to CSV for the frontend:

```bash
npm run export-metadata
```

This creates `public/data/song_metadata.csv` that the frontend loads.

## Complete Workflow

For a fresh setup:

```bash
# 1. Configure Spotify credentials in .env
cp env.template .env
# Edit .env with your credentials

# 2. Seed database (includes metadata fetching)
npm run seed

# 3. Export metadata to CSV for frontend
npm run export-metadata

# 4. Start the development server
npm run dev
```

For existing data:

```bash
# 1. Fetch metadata
npm run fetch-metadata

# 2. Export to CSV
npm run export-metadata

# 3. Restart dev server to load new data
npm run dev
```

## Viewing Analytics

1. Start the dashboard: `npm run dev`
2. Navigate to the **Analytics** tab
3. Select **Audio Features** view
4. Choose your league (League 1 or League 2)

### Available Visualizations

#### 1. Top vs Bottom Songs Comparison
- **Radar Chart**: Visual comparison of audio features between top 20% and bottom 20% voted songs
- **Comparison Table**: Numerical breakdown showing differences in each feature

**Insights**: Identify which audio characteristics are common in highly-voted songs vs poorly-voted songs.

#### 2. Correlation Scatter Plots
- **Energy vs Votes**: See if high-energy songs get more votes
- **Danceability vs Votes**: Check if danceable songs perform better
- **Valence vs Votes**: Discover if happy/positive songs are preferred

**Insights**: Hover over points to see song details. Look for patterns or clusters.

#### 3. Average Votes by Feature Levels
- **Energy Levels**: Low (0-33%), Medium (33-66%), High (66-100%)
- **Danceability Levels**: Low, Medium, High

**Insights**: See which intensity levels perform best in your league.

## Data Storage

### MongoDB Collections

**song_metadata**
```javascript
{
  spotifyUri: "spotify:track:2gZUPNdnz5Y45eiGxpHGSc",
  energy: 0.789,
  danceability: 0.654,
  valence: 0.432,
  acousticness: 0.012,
  instrumentalness: 0.000123,
  liveness: 0.234,
  speechiness: 0.198,
  tempo: 145.032,
  key: 5,
  mode: 1,
  time_signature: 4,
  loudness: -5.234,
  duration_ms: 234567,
  fetchedAt: ISODate("2025-11-14T..."),
  lastUpdated: ISODate("2025-11-14T...")
}
```

**Index**: `spotifyUri` (unique)

### CSV Export Format

The exported CSV includes all audio features for frontend consumption:

```csv
Spotify URI,Energy,Danceability,Valence,Acousticness,Instrumentalness,Liveness,Speechiness,Tempo,Key,Mode,Time Signature,Loudness,Duration (ms),Fetched At
spotify:track:...,0.789,0.654,0.432,...
```

## API Reference

### Spotify API Integration

**src/utils/spotify.js**

```javascript
import { spotifyClient, fetchAudioFeatures } from './utils/spotify.js';

// Fetch metadata for a single song
const metadata = await fetchAudioFeatures('spotify:track:...');

// Fetch metadata for multiple songs (batched)
const allMetadata = await spotifyClient.getAllAudioFeatures(
  ['spotify:track:...', 'spotify:track:...'],
  (progress) => {
    console.log(`${progress.percentage}% complete`);
  }
);
```

**Features:**
- Automatic authentication with client credentials flow
- Rate limiting with exponential backoff
- Batch processing (up to 100 tracks per request)
- Progress tracking
- Error handling and retries

### MongoDB Queries

**src/utils/mongodb.js**

```javascript
import { getSongMetadata, getAudioFeaturesAnalytics } from './utils/mongodb.js';

// Get metadata for a specific song
const metadata = await getSongMetadata('spotify:track:...');

// Get all songs with metadata for a league
const analytics = await getAudioFeaturesAnalytics(leagueId);
```

## Troubleshooting

### "Spotify credentials not configured"

**Solution**: Make sure you've created a `.env` file with valid `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.

### "No song metadata available" in UI

**Solution**:
1. Run `npm run fetch-metadata` to fetch from Spotify
2. Run `npm run export-metadata` to export to CSV
3. Refresh the frontend

### Rate limiting errors

**Solution**: The system automatically handles rate limiting. If you see many 429 errors, wait a few minutes before retrying.

### Some songs missing metadata

**Cause**: Some Spotify tracks may not have audio features available (e.g., very new tracks, podcasts, etc.)

**Solution**: This is normal. The system gracefully handles missing metadata and only analyzes songs that have complete data.

### Metadata seems outdated

**Solution**: Re-fetch metadata with the `--force` flag:
```bash
npm run fetch-metadata -- --force
npm run export-metadata
```

## Performance Considerations

- **Initial fetch**: ~100 songs take about 10-15 seconds
- **Batch size**: Optimized at 100 tracks per request (Spotify's maximum)
- **Rate limits**: Spotify allows many requests, but the system includes safety delays
- **Storage**: Metadata adds ~500 bytes per song to database

## Privacy & Terms

- The app uses Spotify's Client Credentials flow (no user login required)
- Only public track metadata is accessed
- No personal data is collected or stored
- Usage must comply with [Spotify's Developer Terms](https://developer.spotify.com/terms)

## Advanced Usage

### Custom Analytics

You can create custom queries in MongoDB:

```javascript
// Find all high-energy, low-valence songs (intense but sad/angry)
db.song_metadata.find({
  energy: { $gt: 0.7 },
  valence: { $lt: 0.3 }
})

// Average energy by league
db.submissions.aggregate([
  {
    $lookup: {
      from: 'song_metadata',
      localField: 'spotifyUri',
      foreignField: 'spotifyUri',
      as: 'metadata'
    }
  },
  { $unwind: '$metadata' },
  {
    $group: {
      _id: '$leagueId',
      avgEnergy: { $avg: '$metadata.energy' },
      avgDanceability: { $avg: '$metadata.danceability' }
    }
  }
])
```

### Extending the Feature

To add more Spotify data:

1. Update `formatAudioFeatures()` in `src/utils/spotify.js`
2. Add fields to MongoDB schema
3. Update CSV export in `scripts/export-metadata-csv.js`
4. Update data loader in `src/utils/dataLoader.js`
5. Add visualizations in `src/components/AudioFeaturesAnalytics.jsx`

## Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Audio Features Explained](https://developer.spotify.com/documentation/web-api/reference/get-audio-features)
- [Music League](https://musicleague.app/)

## Support

For issues or questions:
1. Check this guide first
2. Review the Spotify API documentation
3. Check MongoDB logs for errors
4. Review browser console for frontend errors

