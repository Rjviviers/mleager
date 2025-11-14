import { useState, useMemo } from 'react';
import { extractGenreFromArtist } from '../utils/dataLoader';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

const SongsTable = ({ data }) => {
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [sortField, setSortField] = useState('totalVotes');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedRow, setExpandedRow] = useState(null);

  // Combine all submissions with their metadata, genres, and votes
  const songsData = useMemo(() => {
    if (!data) return [];

    const league1Songs = data.league1?.submissions || [];
    const league2Songs = data.league2?.submissions || [];

    const allSongs = [
      ...league1Songs.map(s => ({ ...s, league: 'League 1', leagueData: data.league1 })),
      ...league2Songs.map(s => ({ ...s, league: 'League 2', leagueData: data.league2 })),
    ];

    return allSongs.map(song => {
      const genre = extractGenreFromArtist(song['Artist(s)']);
      const spotifyUri = song['Spotify URI'];

      // Calculate total votes for this song
      const votes = song.leagueData.votes.filter(v => v['Spotify URI'] === spotifyUri);
      const totalVotes = votes.reduce((sum, v) => sum + parseInt(v['Points Assigned'] || 0), 0);
      const voteCount = votes.length;

      // Get metadata
      const metadata = song.metadata || {};

      return {
        title: song.Title,
        artist: song['Artist(s)'],
        album: song.Album,
        spotifyUri: spotifyUri,
        league: song.league,
        genre: genre,
        totalVotes: totalVotes,
        voteCount: voteCount,
        avgVotes: voteCount > 0 ? (totalVotes / voteCount).toFixed(1) : 0,
        // Audio features
        energy: metadata.energy !== undefined ? (metadata.energy * 100).toFixed(0) : '-',
        danceability: metadata.danceability !== undefined ? (metadata.danceability * 100).toFixed(0) : '-',
        valence: metadata.valence !== undefined ? (metadata.valence * 100).toFixed(0) : '-',
        acousticness: metadata.acousticness !== undefined ? (metadata.acousticness * 100).toFixed(0) : '-',
        tempo: metadata.tempo !== undefined ? Math.round(metadata.tempo) : '-',
        loudness: metadata.loudness !== undefined ? metadata.loudness.toFixed(1) : '-',
        duration: metadata.duration_ms !== undefined ? formatDuration(metadata.duration_ms) : '-',
        key: metadata.key !== undefined ? formatKey(metadata.key) : '-',
        mode: metadata.mode !== undefined ? (metadata.mode === 1 ? 'Major' : 'Minor') : '-',
        hasMetadata: Object.keys(metadata).length > 0,
      };
    });
  }, [data]);

  // Filter by league
  const filteredSongs = useMemo(() => {
    if (selectedLeague === 'all') return songsData;
    return songsData.filter(song => song.league === selectedLeague);
  }, [songsData, selectedLeague]);

  // Sort songs
  const sortedSongs = useMemo(() => {
    const sorted = [...filteredSongs].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric values
      if (sortField === 'totalVotes' || sortField === 'voteCount' || sortField === 'avgVotes') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortField === 'energy' || sortField === 'danceability' || sortField === 'valence' || sortField === 'acousticness') {
        aVal = aVal === '-' ? -1 : parseFloat(aVal);
        bVal = bVal === '-' ? -1 : parseFloat(bVal);
      } else if (sortField === 'tempo') {
        aVal = aVal === '-' ? -1 : parseInt(aVal);
        bVal = bVal === '-' ? -1 : parseInt(bVal);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredSongs, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ?
      <ChevronUp className="w-4 h-4 text-mint" /> :
      <ChevronDown className="w-4 h-4 text-mint" />;
  };

  if (!data) {
    return (
      <div className="text-center py-12 text-smoke">
        <p>Loading songs data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <h2 className="text-headline font-semibold text-mist mb-4">
          Songs Table
        </h2>
        <p className="text-sm text-smoke mb-4">
          All submitted songs with metadata, genres, and vote information
        </p>
        <div className="flex gap-2">
          {['all', 'League 1', 'League 2'].map((league) => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLeague === league
                  ? 'bg-mint text-charcoal'
                  : 'bg-charcoal text-smoke hover:text-mist'
              }`}
            >
              {league === 'all' ? 'All Leagues' : league}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-graphite rounded-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-charcoal">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-2 hover:text-mist transition-colors"
                  >
                    Song
                    <SortIcon field="title" />
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('artist')}
                    className="flex items-center gap-2 hover:text-mist transition-colors"
                  >
                    Artist
                    <SortIcon field="artist" />
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('genre')}
                    className="flex items-center gap-2 hover:text-mist transition-colors"
                  >
                    Genre
                    <SortIcon field="genre" />
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('league')}
                    className="flex items-center gap-2 hover:text-mist transition-colors"
                  >
                    League
                    <SortIcon field="league" />
                  </button>
                </th>
                <th className="text-right p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('totalVotes')}
                    className="flex items-center gap-2 ml-auto hover:text-mist transition-colors"
                  >
                    Total Votes
                    <SortIcon field="totalVotes" />
                  </button>
                </th>
                <th className="text-right p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('energy')}
                    className="flex items-center gap-2 ml-auto hover:text-mist transition-colors"
                  >
                    Energy
                    <SortIcon field="energy" />
                  </button>
                </th>
                <th className="text-right p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('danceability')}
                    className="flex items-center gap-2 ml-auto hover:text-mist transition-colors"
                  >
                    Dance
                    <SortIcon field="danceability" />
                  </button>
                </th>
                <th className="text-right p-4 text-sm font-medium text-smoke">
                  <button
                    onClick={() => handleSort('valence')}
                    className="flex items-center gap-2 ml-auto hover:text-mist transition-colors"
                  >
                    Mood
                    <SortIcon field="valence" />
                  </button>
                </th>
                <th className="text-center p-4 text-sm font-medium text-smoke">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedSongs.map((song, idx) => (
                <>
                  <tr
                    key={idx}
                    className="border-t border-smoke/10 hover:bg-charcoal/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="text-mist font-medium">{song.title}</div>
                      <div className="text-xs text-smoke mt-1">{song.album}</div>
                    </td>
                    <td className="p-4 text-smoke">{song.artist}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        song.genre === 'Other'
                          ? 'bg-smoke/20 text-smoke'
                          : 'bg-lavender/20 text-lavender'
                      }`}>
                        {song.genre}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        song.league === 'League 1'
                          ? 'bg-mint/20 text-mint'
                          : 'bg-cyan-flash/20 text-cyan-flash'
                      }`}>
                        {song.league}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-mist font-semibold">{song.totalVotes}</div>
                      <div className="text-xs text-smoke">({song.voteCount} votes)</div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={song.hasMetadata ? 'text-mist' : 'text-smoke/50'}>
                        {song.energy}{song.hasMetadata && '%'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={song.hasMetadata ? 'text-mist' : 'text-smoke/50'}>
                        {song.danceability}{song.hasMetadata && '%'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={song.hasMetadata ? 'text-mist' : 'text-smoke/50'}>
                        {song.valence}{song.hasMetadata && '%'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        className="text-lavender hover:text-lavender/80 transition-colors text-sm font-medium"
                      >
                        {expandedRow === idx ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === idx && (
                    <tr className="bg-charcoal/30 border-t border-smoke/10">
                      <td colSpan="9" className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-smoke mb-1">Acousticness</div>
                            <div className="text-mist font-medium">
                              {song.acousticness}{song.hasMetadata && '%'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Tempo (BPM)</div>
                            <div className="text-mist font-medium">{song.tempo}</div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Loudness (dB)</div>
                            <div className="text-mist font-medium">{song.loudness}</div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Duration</div>
                            <div className="text-mist font-medium">{song.duration}</div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Key</div>
                            <div className="text-mist font-medium">{song.key}</div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Mode</div>
                            <div className="text-mist font-medium">{song.mode}</div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Avg Vote</div>
                            <div className="text-mint font-medium">{song.avgVotes}</div>
                          </div>
                          <div>
                            <div className="text-xs text-smoke mb-1">Spotify URI</div>
                            <div className="text-xs text-smoke truncate font-mono">{song.spotifyUri}</div>
                          </div>
                        </div>
                        {!song.hasMetadata && (
                          <div className="mt-4 p-3 bg-sun/10 border border-sun/20 rounded-lg">
                            <p className="text-sm text-sun">
                              ⚠️ No metadata available for this song. Run the metadata fetch scripts to get audio features.
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-charcoal border-t border-smoke/10">
          <p className="text-sm text-smoke text-center">
            Showing {sortedSongs.length} songs
            {!songsData.every(s => s.hasMetadata) && (
              <span className="ml-2 text-sun">
                • Some songs missing metadata
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatKey(keyNum) {
  const keys = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  return keys[keyNum] || '-';
}

export default SongsTable;

