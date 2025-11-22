import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    roundId: { type: String, ref: 'Round', required: true },
    leagueId: { type: Number, ref: 'League' }, // Added based on usage
    spotifyUri: { type: String, required: true },
    submitterId: { type: String, ref: 'Competitor', required: true },
    comment: { type: String },
    // Denormalized fields for easier access, though we should rely on metadata
    title: { type: String },
    artists: { type: [String] }, // Array of artist names
    album: { type: String },
    albumArt: { type: String },
}, { timestamps: true });

export const Submission = mongoose.model('Submission', submissionSchema);
