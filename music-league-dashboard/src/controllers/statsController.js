import { League } from '../models/League.js';
import { Round } from '../models/Round.js';
import { Submission } from '../models/Submission.js';
import { Vote } from '../models/Vote.js';
import { Competitor } from '../models/Competitor.js';

export const getOverviewStats = async (req, res) => {
    try {
        const [totalSubmissions, totalVotes, totalRounds, totalCompetitors] = await Promise.all([
            Submission.countDocuments(),
            Vote.countDocuments(),
            Round.countDocuments(),
            Competitor.countDocuments()
        ]);

        const leagues = await League.find({}).sort({ name: 1 });
        const leagueStats = [];

        for (const league of leagues) {
            const leagueId = league._id;

            const roundsCount = await Round.countDocuments({ leagueId: league._id });
            const competitorsCount = await Competitor.countDocuments({ leagues: league._id });
            const submissionsCount = await Submission.countDocuments({ leagueId: league._id });
            const votesCount = await Vote.countDocuments({ leagueId: league._id });

            // Get recent rounds for this league
            const recentRounds = await Round.find({ leagueId: league._id })
                .sort({ created: -1 })
                .limit(5);

            leagueStats.push({
                ...league.toObject(),
                stats: {
                    rounds: roundsCount,
                    competitors: competitorsCount,
                    submissions: submissionsCount,
                    votes: votesCount
                },
                recentRounds
            });
        }

        // Flatten recent rounds from all leagues and sort
        const allRecentRounds = leagueStats.flatMap(l => l.recentRounds.map(r => ({ ...r.toObject(), leagueName: l.name })))
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 5);

        res.json({
            totalSubmissions,
            totalVotes,
            totalRounds,
            leagues: leagueStats,
            recentRounds: allRecentRounds
        });

    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({ error: 'Failed to fetch overview stats' });
    }
};

export const getLeagueAnalytics = async (req, res) => {
    try {
        const { leagueId } = req.params;

        const submissions = await Submission.aggregate([
            { $match: { leagueId: parseInt(leagueId) } },
            {
                $lookup: {
                    from: 'votes',
                    localField: 'spotifyUri',
                    foreignField: 'spotifyUri',
                    as: 'votes'
                }
            },
            {
                $lookup: {
                    from: 'song_metadata',
                    localField: 'spotifyUri',
                    foreignField: 'spotifyUri',
                    as: 'metadata'
                }
            },
            {
                $unwind: {
                    path: '$metadata',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    title: { $ifNull: ['$metadata.title', '$title'] },
                    artist: { $ifNull: ['$metadata.artists', '$artists'] },
                    spotifyUri: 1,
                    genre: { $ifNull: ['$metadata.genre', 'Unknown'] },
                    allGenres: { $ifNull: ['$metadata.allGenres', []] },
                    popularity: { $ifNull: ['$metadata.popularity', 0] },
                    totalVotes: { $sum: '$votes.pointsAssigned' },
                    voteCount: { $size: '$votes' }
                }
            }
        ]);

        // Process for Genre Analysis
        const genreStats = {};
        const artistStats = {};
        const popularityStats = [];

        submissions.forEach(sub => {
            // Genre
            const genre = sub.genre;
            if (genre && genre !== 'Unknown') {
                if (!genreStats[genre]) {
                    genreStats[genre] = { genre, votes: 0, submissions: 0, relatedGenres: new Set() };
                }
                genreStats[genre].votes += sub.totalVotes;
                genreStats[genre].submissions += 1;
                sub.allGenres.forEach(g => genreStats[genre].relatedGenres.add(g));
            }

            // Artist Processing
            let artistName = 'Unknown Artist';
            if (Array.isArray(sub.artist)) {
                // Take the first artist for grouping, or join them?
                // For stats, usually per main artist. Let's take first.
                const firstArtist = sub.artist[0];
                artistName = (typeof firstArtist === 'object' && firstArtist !== null && firstArtist.name) ? firstArtist.name : String(firstArtist);
            } else if (typeof sub.artist === 'object' && sub.artist !== null && sub.artist.name) {
                artistName = sub.artist.name;
            } else if (sub.artist) {
                artistName = String(sub.artist);
            }

            if (artistName) {
                if (!artistStats[artistName]) {
                    artistStats[artistName] = { artist: artistName, votes: 0, submissions: 0 };
                }
                artistStats[artistName].votes += sub.totalVotes;
                artistStats[artistName].submissions += 1;
            }

            // Popularity
            if (sub.popularity > 0) {
                // Format artist for display
                let displayArtist = artistName;
                if (Array.isArray(sub.artist)) {
                    displayArtist = sub.artist.map(a => (typeof a === 'object' && a !== null && a.name) ? a.name : a).join(', ');
                }

                popularityStats.push({
                    title: sub.title,
                    artist: displayArtist,
                    votes: sub.totalVotes,
                    popularity: sub.popularity
                });
            }
        });

        const formattedGenreStats = Object.values(genreStats).map(g => ({
            ...g,
            avgVotes: Math.round(g.votes / g.submissions),
            relatedGenres: g.relatedGenres.size
        })).sort((a, b) => b.votes - a.votes);

        const formattedArtistStats = Object.values(artistStats).map(a => ({
            ...a,
            avgVotes: Math.round(a.votes / a.submissions)
        })).sort((a, b) => b.votes - a.votes).slice(0, 10);

        res.json({
            genreAnalysis: formattedGenreStats,
            artistAnalysis: formattedArtistStats,
            popularityAnalysis: popularityStats
        });

    } catch (error) {
        console.error('Error fetching league analytics:', error);
        res.status(500).json({ error: 'Failed to fetch league analytics' });
    }
};
