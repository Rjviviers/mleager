import mongoose from 'mongoose';

const songMetadataSchema = new mongoose.Schema({
    spotifyUri: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    artist: { type: String }, // Or array of strings
    album: { type: String },
    albumArt: { type: String },
    previewUrl: { type: String },
    popularity: { type: Number },
    duration_ms: { type: Number },
    explicit: { type: Boolean },
    genres: { type: [String] },
    energy: { type: Number },
    danceability: { type: Number },
    valence: { type: Number },
    acousticness: { type: Number },
    tempo: { type: Number },
    loudness: { type: Number },
}, { timestamps: true });

export const SongMetadata = mongoose.model('SongMetadata', songMetadataSchema, 'song_metadata'); // Explicit collection name
