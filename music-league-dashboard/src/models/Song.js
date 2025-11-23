import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
    name: { type: String, required: true },
    artists: { type: [String], required: true },
    metadataId: { type: String, required: true, unique: true }, // This will be the spotifyUri
    submissionCount: { type: Number, default: 0 }
}, { timestamps: true });

export const Song = mongoose.model('Song', songSchema);
