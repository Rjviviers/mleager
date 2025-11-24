import { Round } from '../models/Round.js';
import { Submission } from '../models/Submission.js';
import { Vote } from '../models/Vote.js';
import { SongMetadata } from '../models/SongMetadata.js';

export const getRoundDetails = async (req, res) => {
    try {
        const { roundId } = req.params;
        const round = await Round.findOne({ _id: roundId });

        if (!round) {
            return res.status(404).json({ error: 'Round not found' });
        }

        const submissions = await Submission.find({ roundId });
        const votes = await Vote.find({ roundId });

        // Enrich submissions with metadata
        const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
            const metadata = await SongMetadata.findOne({ spotifyUri: sub.spotifyUri });
            return {
                ...sub.toObject(),
                metadata: metadata || null
            };
        }));

        res.json({
            round,
            submissions: enrichedSubmissions,
            votes
        });
    } catch (error) {
        console.error('Error fetching round details:', error);
        res.status(500).json({ error: 'Failed to fetch round details' });
    }
};
