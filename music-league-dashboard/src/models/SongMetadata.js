import mongoose from 'mongoose';

const songMetadataSchema = new mongoose.Schema({
    spotifyUri: { type: String, required: true, unique: true },
    name: { type: String, required: true }, // Was title
    artists: { type: mongoose.Schema.Types.Mixed }, // Was artist (String). Data has artists (Array/Object)
    album: { type: mongoose.Schema.Types.Mixed }, // Was String. Data has Object
    albumArt: { type: String }, // Might be inside album object?
    preview_url: { type: String }, // Was previewUrl
    popularity: { type: Number },
    duration_ms: { type: Number },
    explicit: { type: Boolean },
    genres: { type: [String] },
    allGenres: { type: [String] },
    genre: { type: String },
    energy: { type: Number },
    danceability: { type: Number },
    valence: { type: Number },
    acousticness: { type: Number },
    tempo: { type: Number },
    loudness: { type: Number },
    spotify_url: { type: String },
    fetchedAt: { type: Date },
    lastUpdated: { type: Date }
}, { timestamps: true });

export const SongMetadata = mongoose.model('SongMetadata', songMetadataSchema, 'song_metadata'); // Explicit collection name
