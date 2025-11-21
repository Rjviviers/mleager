import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
    _id: { type: Number, required: true }, // Keeping Number for compatibility with existing data if possible, or we might migrate to ObjectId later
    name: { type: String, required: true },
    // Add other fields as discovered
}, { timestamps: true });

export const League = mongoose.model('League', leagueSchema);
