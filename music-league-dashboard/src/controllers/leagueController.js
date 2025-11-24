import { League } from '../models/League.js';
import { Round } from '../models/Round.js';
import { Competitor } from '../models/Competitor.js';

export const getAllLeagues = async (req, res) => {
    try {
        const leagues = await League.find({}).sort({ name: 1 });
        res.json(leagues);
    } catch (error) {
        console.error('Error fetching leagues:', error);
        res.status(500).json({ error: 'Failed to fetch leagues' });
    }
};

export const getLeagueDetails = async (req, res) => {
    try {
        const { leagueId } = req.params;
        const league = await League.findById(leagueId);

        if (!league) {
            return res.status(404).json({ error: 'League not found' });
        }

        const rounds = await Round.find({ leagueId: parseInt(leagueId) }).sort({ created: -1 });
        const competitors = await Competitor.find({ leagues: parseInt(leagueId) });

        res.json({
            league,
            rounds,
            competitors
        });
    } catch (error) {
        console.error('Error fetching league details:', error);
        res.status(500).json({ error: 'Failed to fetch league details' });
    }
};
