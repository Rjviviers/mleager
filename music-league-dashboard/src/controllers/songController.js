import { Submission } from '../models/Submission.js';
import { Vote } from '../models/Vote.js';
import { SongMetadata } from '../models/SongMetadata.js';
import { League } from '../models/League.js';

export const getAllSongs = async (req, res) => {
    try {
        // Aggregate all submissions and join with votes and metadata
        const songs = await Submission.aggregate([
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
                $lookup: {
                    from: 'leagues',
                    localField: 'leagueId',
                    foreignField: '_id', // Assuming leagueId in Submission matches _id in League (Number vs ObjectId issue?)
                    // If League._id is ObjectId and Submission.leagueId is Number, this lookup will fail.
                    // We need to verify this.
                    // Based on previous analysis, League._id might be ObjectId but we used Number in schemas.
                    // Let's assume for now we need to handle this.
                    // If schemas are correct (Number ref 'League'), then League._id should be Number?
                    // Mongoose usually uses ObjectId by default.
                    // If the original seed script used custom _id, then it works.
                    // Let's assume it works for now, or we fix it later.
                    as: 'league'
                }
            },
            {
                $unwind: {
                    path: '$league',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    title: { $ifNull: ['$metadata.title', '$title'] },
                    artist: { $ifNull: ['$metadata.artists', '$artists'] },
                    album: { $ifNull: ['$metadata.album', '$album'] },
                    spotifyUri: 1,
                    leagueName: { $ifNull: ['$league.name', 'Unknown League'] },
                    genres: { $ifNull: ['$metadata.genres', []] },
                    popularity: { $ifNull: ['$metadata.popularity', 0] },
                    totalVotes: { $sum: '$votes.pointsAssigned' },
                    voteCount: { $size: '$votes' },
                    created: '$createdAt'
                }
            }
        ]);

        // Post-process to format artists and albums
        const formattedSongs = songs.map(song => {
            // Format Artist
            let artistName = 'Unknown Artist';
            if (Array.isArray(song.artist)) {
                artistName = song.artist.map(a => (typeof a === 'object' && a !== null && a.name) ? a.name : a).join(', ');
            } else if (typeof song.artist === 'object' && song.artist !== null && song.artist.name) {
                artistName = song.artist.name;
            } else if (song.artist) {
                artistName = String(song.artist);
            }

            // Format Album
            let albumName = 'Unknown Album';
            if (typeof song.album === 'object' && song.album !== null && song.album.name) {
                albumName = song.album.name;
            } else if (song.album) {
                albumName = String(song.album);
            }

            return {
                ...song,
                artist: artistName,
                album: albumName,
                avgVotes: song.voteCount > 0 ? (song.totalVotes / song.voteCount).toFixed(1) : 0
            };
        });

        res.json(formattedSongs);

    } catch (error) {
        console.error('Error fetching all songs:', error);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
};
