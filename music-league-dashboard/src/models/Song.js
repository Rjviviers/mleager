import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
    name: { type: String, required: true },
    artists: { type: [String], required: true },
    metadataId: { type: mongoose.Schema.Types.ObjectId, ref: 'SongMetadata', required: true, unique: true }, // Reference to SongMetadata _id
    submissionCount: { type: Number, default: 0 },
    genres: { type: [String], default: [] }
}, { timestamps: true });

export const Song = mongoose.model('Song', songSchema);
