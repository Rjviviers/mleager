import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
    roundId: { type: String, ref: 'Round', required: true, index: true },
    leagueId: { type: Number, ref: 'League', required: true, index: true },
    voterId: { type: String, ref: 'Competitor', required: true },
    spotifyUri: { type: String, required: true }, // The song being voted for
    pointsAssigned: { type: Number, required: true },
    comment: { type: String },
}, { timestamps: true });

// Compound index for fetching votes by round
voteSchema.index({ roundId: 1, voterId: 1 });

export const Vote = mongoose.model('Vote', voteSchema);
