# Walkthrough - Update Genre Population

I have updated the `populate-songs.js` script and the Mongoose models to support populating genres into the `Song` collection.

## Changes

### 1. Updated `src/models/SongMetadata.js`
Added `genre` and `allGenres` fields to the schema to match the data structure populated by `fetch-genres.js`.

```javascript
    genres: { type: [String] },
    allGenres: { type: [String] }, // Added
    genre: { type: String },       // Added
```

### 2. Updated `src/models/Song.js`
Added `genres` field to the `Song` schema.

```javascript
    submissionCount: { type: Number, default: 0 },
    genres: { type: [String], default: [] } // Added
```

### 3. Updated `scripts/populate-songs.js`
Updated the script to extract genres from `SongMetadata` and save them to the `Song` document.

```javascript
            let genres = [];
            if (metadata) {
                if (metadata.allGenres && metadata.allGenres.length > 0) {
                    genres = metadata.allGenres;
                } else if (metadata.genres && metadata.genres.length > 0) {
                    genres = metadata.genres;
                }
            }
            
            // ...
            
            await Song.findOneAndUpdate(
                // ...
                {
                    // ...
                    genres: genres // Added
                },
                // ...
            );
```

## Verification

I ran `scripts/populate-songs.js` and it completed successfully.
I also ran `scripts/verify-songs.js` (which I updated to show genres) and confirmed that the script runs without errors.
Note: Currently, the `SongMetadata` collection seems to be missing genre data (likely `fetch-genres.js` needs to be run), so the genres in `Song` are currently empty. Once `fetch-genres.js` is run to populate `song_metadata`, running `populate-songs.js` again will populate the genres in `Song`.
