# Music League Dashboard - Data Status

## ✅ Currently Available Data

### 1. Song Metadata (584 songs)
**Source:** Spotify `/tracks` endpoint
**Status:** ✅ Fully populated
**Collection:** `song_metadata`

**Includes:**
- Track name, artists, album
- Release date, duration
- Popularity score (0-100)
- Explicit flag
- Album artwork URLs
- Spotify preview URLs
- External links

### 2. Artist Genres (608 artists)
**Source:** Spotify `/artists` endpoint
**Status:** ✅ Fully populated
**Collection:** `artist_info`

**Includes:**
- Artist name, ID, URI
- Genres (346 artists have genres, 262 don't)
- Popularity score (0-100)
- Follower count
- Artist images
- External links

**Top Genres:**
1. Metal - 37 artists
2. Rock - 29 artists
3. Alternative Metal - 20 artists
4. Metalcore - 19 artists
5. Classic Rock - 19 artists
6. Nu Metal - 19 artists
7. Pop Punk - 16 artists
8. Alternative Rock - 14 artists
9. Hard Rock - 13 artists
10. Rap Metal - 13 artists

### 3. Competition Data (Original CSVs)
**Source:** Your CSV files
**Status:** ✅ Available
**Collections:** `submissions`, `votes`, `rounds`, `competitors`

**Includes:**
- All submission data
- Voting records
- Round information
- Competitor details

---

## ❌ NOT Available (Requires Spotify Extended Quota Mode)

### Audio Features
**Source:** Spotify `/audio-features` endpoint
**Status:** ❌ Blocked (403 Forbidden)
**Reason:** Requires Extended Quota Mode approval

**Would Include:**
- Energy (0.0 - 1.0)
- Danceability (0.0 - 1.0)
- Valence/Mood (0.0 - 1.0)
- Acousticness (0.0 - 1.0)
- Instrumentalness (0.0 - 1.0)
- Liveness (0.0 - 1.0)
- Speechiness (0.0 - 1.0)
- Tempo (BPM)
- Key, Mode
- Loudness (dB)
- Time signature

**How to Get:** See `SPOTIFY_QUOTA_SOLUTION.md`

---

## 📊 What You CAN Analyze Now

### Song Analytics:
- ✅ Most popular songs (by Spotify popularity score)
- ✅ Submission patterns by release year
- ✅ Song duration analysis
- ✅ Explicit content trends
- ✅ Album diversity

### Artist Analytics:
- ✅ Most popular artists
- ✅ Artist diversity metrics
- ✅ Artist follower counts
- ✅ Repeat artists across rounds

### Genre Analytics:
- ✅ Genre distribution
- ✅ Genre trends by round
- ✅ Genre preferences by competitor
- ✅ Multi-genre songs
- ✅ Genre vs votes correlation
- ✅ Genre vs popularity

### Competition Analytics:
- ✅ Voting patterns
- ✅ Submission statistics
- ✅ Round-by-round performance
- ✅ Competitor win rates
- ✅ Strategic voting analysis

---

## 📊 What You CANNOT Analyze Yet

### Audio-Based Analytics (Need Extended Quota):
- ❌ Most energetic songs
- ❌ Danceability scores
- ❌ Mood/valence analysis
- ❌ Tempo clustering
- ❌ Key/mode patterns
- ❌ "Chill vs Hype" classifications
- ❌ Acoustic vs Electronic splits
- ❌ Instrumental content

---

## 🛠️ Available Scripts

### Data Fetching:
```bash
# Fetch basic song metadata (works now)
node scripts/fetch-basic-metadata.js

# Fetch artist genres (works now)
node scripts/fetch-genres.js

# Fetch audio features (requires approval)
node scripts/fetch-song-metadata.js
```

### Examples & Testing:
```bash
# View genre examples and queries
node scripts/genre-examples.js

# Export metadata to CSV
node scripts/export-metadata-csv.js
```

### Options:
```bash
# Force re-fetch existing data
--force

# Limit to N songs (for testing)
--limit N
```

---

## 🗄️ Database Structure

### MongoDB Collections:

| Collection | Documents | Purpose |
|------------|-----------|---------|
| `competitors` | Varies | League participants |
| `rounds` | Varies | League rounds |
| `submissions` | 584 | Song submissions |
| `votes` | Varies | Voting records |
| `song_metadata` | 584 | Track info from Spotify |
| `artist_info` | 608 | Artist info with genres |

### Relationships:

```
submissions.spotifyUri → song_metadata.spotifyUri
song_metadata.artists[].id → artist_info.artistId
```

---

## 🚀 Next Steps

### Immediate (Can Do Now):
1. ✅ Build genre visualizations
2. ✅ Create popularity analytics
3. ✅ Add release year trends
4. ✅ Show artist diversity metrics
5. ✅ Genre-based filtering

### Future (After Extended Quota Approval):
1. ⏳ Audio feature visualizations
2. ⏳ Energy/mood clustering
3. ⏳ Tempo analysis
4. ⏳ "Vibe" classifications
5. ⏳ Musical similarity recommendations

### Optional Enhancements:
- Add Last.fm data for additional genre tags
- Integrate with lyrics APIs
- Add user-created playlists
- Export to Spotify playlists

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DATA_STATUS.md` | This file - current data status |
| `GENRE_GUIDE.md` | How to use genre data |
| `SPOTIFY_QUOTA_SOLUTION.md` | Fixing the 403 error |
| `SONG_METADATA_GUIDE.md` | Metadata schema reference |
| `IMPLEMENTATION_SUMMARY.md` | Technical implementation details |

---

## 🔧 Maintenance

### Update Genre Data:
```bash
# Fetch genres for new artists only
node scripts/fetch-genres.js

# Re-fetch all genres
node scripts/fetch-genres.js --force
```

### Update Song Metadata:
```bash
# Fetch metadata for new songs only
node scripts/fetch-basic-metadata.js

# Re-fetch all metadata
node scripts/fetch-basic-metadata.js --force
```

### Check Data Coverage:
```bash
# View statistics
node scripts/genre-examples.js
```

---

## ✅ Summary

**You have everything you need for genre-based analytics!**

- ✅ 584 songs with full metadata
- ✅ 608 artists with genre information
- ✅ 346 artists have genres (56.9% coverage)
- ✅ All data stored in MongoDB
- ✅ Ready to integrate into dashboard

The only missing piece is audio features (energy, danceability, etc.), which requires Spotify Extended Quota Mode approval. But you have plenty of rich data to work with for now!

