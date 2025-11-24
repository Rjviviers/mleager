import mongoose from 'mongoose';

const artistInfoSchema = new mongoose.Schema({
    artistId: { type: String, required: true, unique: true },
    artistUri: { type: String },
    name: { type: String, required: true },
    genres: { type: [String] },
    popularity: { type: Number },
    followers: { type: Number },
    images: { type: [mongoose.Schema.Types.Mixed] }, // Array of image objects
    spotify_url: { type: String },
    fetchedAt: { type: Date },
    lastUpdated: { type: Date }
}, { timestamps: true });

export const ArtistInfo = mongoose.model('ArtistInfo', artistInfoSchema, 'artist_info');
