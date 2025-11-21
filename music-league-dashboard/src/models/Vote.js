import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Or auto-generated ObjectId
    roundId: { type: String, ref: 'Round', required: true },
    leagueId: { type: Number, ref: 'League' }, // Added based on usage
    voterId: { type: String, ref: 'Competitor', required: true },
    spotifyUri: { type: String, required: true }, // The song being voted for
    pointsAssigned: { type: Number, required: true },
    comment: { type: String },
}, { timestamps: true });

export const Vote = mongoose.model('Vote', voteSchema);
