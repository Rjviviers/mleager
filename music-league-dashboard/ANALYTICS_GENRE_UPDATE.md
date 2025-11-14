# Analytics Genre Tab Update

## Summary

The Analytics Genre tab has been completely updated to use the new comprehensive genre classification system instead of the old mock genre extraction function.

## What Changed

### 1. **Analytics Component** (`src/components/Analytics.jsx`)

#### Before:
- Used `extractGenreFromArtist()` function with hardcoded genre mappings for ~15 artists
- Showed "Other" for most songs
- Limited genre insights

#### After:
- Uses real genre data from `song_metadata` collection
- Pulls genre information from Spotify via artist_info
- Shows actual genre distribution across all songs
- Displays related genres and multi-genre insights

### 2. **Data Loader** (`src/utils/dataLoader.js`)

#### Updated:
- Added `genre` field to metadata map (from CSV)
- Added `allGenres` array with all genres from song's artists
- Properly parses genre data from exported CSV

### 3. **Export Script** (`scripts/export-metadata-csv.js`)

#### Updated:
- Exports `Genre` column with primary genre
- Exports `All Genres` column with semicolon-separated list of all genres
- Shows genre coverage statistics in export summary

## New Features in Genre Tab

### 📊 Overview Stats
Three summary cards showing:
- **Total Genres**: Number of unique genres in the league
- **Most Popular Genre**: Genre with the most votes
- **Avg Votes per Genre**: Average voting performance

### 📈 Visualizations

#### 1. **Total Votes by Genre** (Bar Chart)
- Shows top 10 genres by total votes
- Angled labels for readability
- Hover tooltip with detailed stats:
  - Total votes
  - Number of songs
  - Average votes per song
  - Related genres count

#### 2. **Genre Composition** (Pie Chart)
- Shows distribution of songs by genre (top 8)
- Displays percentage of total submissions
- Interactive tooltips with vote statistics

### 📋 Genre Performance Table

A detailed scrollable table showing:
- **Color-coded genres** for visual identification
- **Related genres indicator** (e.g., "+3 related")
- **Songs count** - Number of submissions in each genre
- **Total votes** - Cumulative votes for the genre
- **Average votes** - Average votes per song
- **Performance bar** - Visual indicator of genre performance

### 🎯 Empty State

If no genre data is available, shows helpful message with instructions:
```
Run node scripts/seed-genres.js and npm run export-metadata to populate genre data
```

## How to Use

### Step 1: Seed Genres (One-Time Setup)

```bash
cd music-league-dashboard

# Populate genres collection and add genre fields to songs
node scripts/seed-genres.js
```

### Step 2: Export to CSV (For Frontend)

```bash
# Export metadata including genres to CSV
node scripts/export-metadata-csv.js
```

Or use the npm script:
```bash
npm run export-metadata
```

### Step 3: View in Dashboard

1. Start the dev server: `npm run dev`
2. Navigate to the Analytics section
3. Select a league (League 1 or League 2)
4. Click on the **Genre** tab
5. Explore the genre visualizations and statistics!

## Features & Insights

### What You Can Analyze:

1. **Genre Popularity**
   - Which genres dominate your music league?
   - Which genres get the most votes?

2. **Genre Performance**
   - Do certain genres consistently perform better?
   - Average votes per song by genre

3. **Genre Diversity**
   - How many unique genres are represented?
   - Which genres have multiple related sub-genres?

4. **Voting Patterns**
   - Do voters prefer certain genres?
   - Are there surprising genre winners?

### Example Insights:

- **"Metal dominates with 45 songs and 892 total votes"**
- **"Alternative rock has the highest average votes (23 per song)"**
- **"10 unique genres represented across 156 submissions"**
- **"Thrash metal has +5 related genres (death metal, speed metal, etc.)"**

## Data Flow

```
MongoDB (artist_info collection)
    ↓
seed-genres.js script
    ↓
MongoDB (genres + song_metadata.genre fields)
    ↓
export-metadata-csv.js script
    ↓
public/data/song_metadata.csv
    ↓
dataLoader.js (frontend)
    ↓
Analytics.jsx (Genre tab)
```

## Technical Details

### Genre Selection Logic

For each song:
1. Gets all artists
2. Fetches genres from artist_info
3. Selects **first genre** as primary
4. Stores all genres in `allGenres` array

### Data Structure in CSV

```csv
Spotify URI,Energy,Danceability,...,Genre,All Genres,Fetched At
spotify:track:xxx,0.8,0.7,...,thrash metal,thrash metal; metal; speed metal,2025-11-14...
```

### Data Structure in Frontend

```javascript
submission.metadata = {
  energy: 0.8,
  danceability: 0.7,
  // ... other audio features
  genre: "thrash metal",  // Primary genre
  allGenres: ["thrash metal", "metal", "speed metal"]  // All genres
}
```

## Advantages Over Old System

| Old System | New System |
|------------|------------|
| Hardcoded 15 artists | Real data from Spotify |
| "Other" for most songs | Actual genre names |
| No genre insights | Rich genre analytics |
| No multi-genre support | Tracks all related genres |
| Static mappings | Dynamic from database |

## Compatibility

### Backward Compatibility:
- ✅ Works with existing CSV data structure
- ✅ Gracefully handles missing genre data
- ✅ Shows helpful message when genres not populated
- ✅ Doesn't break if song_metadata.csv doesn't have genre columns

### Requirements:
- MongoDB with `artist_info` collection populated
- `seed-genres.js` script run at least once
- `export-metadata-csv.js` script run after seeding

## Troubleshooting

### "No genre data available"

**Solution:**
```bash
# 1. Populate genres
node scripts/seed-genres.js

# 2. Export to CSV
node scripts/export-metadata-csv.js

# 3. Refresh browser
```

### "Only seeing a few genres"

**Cause:** Not all artists have genre data on Spotify (~43% don't)

**This is normal!** Spotify doesn't assign genres to all artists, especially:
- Newer/smaller artists
- Very niche artists
- Some legacy artists

### Genres look wrong

**Solution:** Re-run the genre seeding to refresh:
```bash
node scripts/seed-genres.js
node scripts/export-metadata-csv.js
```

## Future Enhancements

Potential improvements:
- [ ] Genre filter dropdown
- [ ] Genre trends over time (by round)
- [ ] Competitor genre preferences
- [ ] Genre vs audio features correlation
- [ ] Custom genre categories/grouping
- [ ] Genre diversity score

## Related Documentation

- [GENRE_SEEDING.md](GENRE_SEEDING.md) - Complete genre system guide
- [GENRE_QUICKSTART.md](GENRE_QUICKSTART.md) - Quick setup guide
- [GENRE_GUIDE.md](GENRE_GUIDE.md) - Working with artist genres

---

**Updated:** 2025-11-14
**Components Modified:** Analytics.jsx, dataLoader.js, export-metadata-csv.js
**New Visualizations:** 3 stats cards, 2 charts, 1 detailed table
**Data Source:** Real Spotify genre data via artist_info collection

