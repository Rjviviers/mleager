import mongoose from 'mongoose';

const competitorSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Assuming IDs are strings based on usage
    name: { type: String, required: true },
    leagues: [{ type: Number, ref: 'League' }], // Array of League IDs
}, { timestamps: true });

export const Competitor = mongoose.model('Competitor', competitorSchema);
