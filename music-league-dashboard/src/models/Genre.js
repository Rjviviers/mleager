import mongoose from 'mongoose';

const genreSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    artistCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export const Genre = mongoose.model('Genre', genreSchema, 'genres');
