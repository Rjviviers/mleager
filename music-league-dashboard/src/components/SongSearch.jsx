import { useState, useMemo } from 'react';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

const SongSearch = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeague, setSelectedLeague] = useState('all');

  const allSubmissions = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data;
  }, [data]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return [];

    const term = searchTerm.toLowerCase();
    let results = allSubmissions.filter(
      (song) =>
        song.title?.toLowerCase().includes(term) ||
        song.artist?.toLowerCase().includes(term) ||
        song.album?.toLowerCase().includes(term)
    );

    if (selectedLeague !== 'all') {
      results = results.filter(s => s.leagueName === selectedLeague);
    }

    return results;
  }, [searchTerm, allSubmissions, selectedLeague]);

  const duplicateGroups = useMemo(() => {
    const groups = {};
    filteredSongs.forEach((song) => {
      const key = `${song.title}-${song.artist}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(song);
    });
    return groups;
  }, [filteredSongs]);

  return (
    <div className="space-y-6">
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <h2 className="text-headline font-semibold text-mist mb-4">
          Search Submitted Songs
        </h2>
        <p className="text-sm text-smoke mb-6">
          Search for songs to avoid duplicate submissions across all rounds and leagues
        </p>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-smoke" />
          <input
            type="text"
            placeholder="Search by title, artist, or album..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-charcoal border border-smoke/20 rounded-xl pl-12 pr-4 py-3 text-mist placeholder-smoke focus:outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 transition-all"
          />
        </div>

        {/* League Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedLeague('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLeague === 'all'
              ? 'bg-lavender text-white'
              : 'bg-charcoal text-smoke hover:text-mist'
              }`}
          >
            All Leagues
          </button>
          {[...new Set(allSubmissions.map(s => s.leagueName))].filter(Boolean).map((league) => (
            <button
              key={league}
              onClick={() => setSelectedLeague(league)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLeague === league
                ? 'bg-lavender text-white'
                : 'bg-charcoal text-smoke hover:text-mist'
                }`}
            >
              {league}
            </button>
          ))}
        </div>

        {/* Results */}
        {searchTerm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-mist">
                {filteredSongs.length} Results Found
              </h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(duplicateGroups).map(([key, songs]) => {
                const isDuplicate = songs.length > 1;
                const song = songs[0];

                return (
                  <div
                    key={key}
                    className={`bg-charcoal rounded-lg p-4 border-l-4 ${isDuplicate
                      ? 'border-sun'
                      : 'border-mint'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-mist">{song.title}</h4>
                          {isDuplicate && (
                            <span className="flex items-center gap-1 text-xs bg-sun/20 text-sun px-2 py-1 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              {songs.length}x Submitted
                            </span>
                          )}
                          {!isDuplicate && (
                            <span className="flex items-center gap-1 text-xs bg-mint/20 text-mint px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Unique
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-smoke">
                          {song.artist} • {song.album}
                        </p>
                        <div className="mt-2 space-y-1">
                          {songs.map((s, idx) => (
                            <div key={idx} className="text-xs text-smoke flex items-center gap-2">
                              <span className="bg-smoke/20 px-2 py-0.5 rounded">{s.leagueName}</span>
                              {s.created && (
                                <>
                                  <span>•</span>
                                  <span>{new Date(s.created).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!searchTerm && (
          <div className="text-center py-12 text-smoke">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Start typing to search for songs</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongSearch;

