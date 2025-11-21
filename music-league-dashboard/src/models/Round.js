import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    leagueId: { type: Number, ref: 'League', required: true },
    name: { type: String }, // Assuming rounds have names
    description: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    playlistUrl: { type: String },
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } }); // Mapping 'created' to createdAt

export const Round = mongoose.model('Round', roundSchema);
