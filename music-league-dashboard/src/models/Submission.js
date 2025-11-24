import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    roundId: { type: String, ref: 'Round', required: true, index: true },
    leagueId: { type: Number, ref: 'League', required: true, index: true },
    spotifyUri: { type: String, required: true },
    submitterId: { type: String, ref: 'Competitor', required: true },
    comment: { type: String },
    // Denormalized fields for easier access, though we should rely on metadata
    title: { type: String },
    artists: { type: [String] }, // Array of artist names
    album: { type: String },
    albumArt: { type: String },
}, { timestamps: true });

// Compound index for fetching submissions by round
submissionSchema.index({ roundId: 1, submitterId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
