import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter } from 'recharts';

const COLORS = ['#4EE2B5', '#2EC9FF', '#A178F1', '#E044A7', '#FFE200'];

const Analytics = ({ data }) => {
  const [selectedLeague, setSelectedLeague] = useState('league1');
  const [viewType, setViewType] = useState('genre');
  const [fetchedData, setFetchedData] = useState({}); // { [leagueKey]: { competitors, rounds, submissions, votes } }
  const [loading, setLoading] = useState(false);

  // Load data for the selected league using granular endpoints
  useEffect(() => {
    const loadLeagueData = async () => {
      setLoading(true);
      try {
        // Get all leagues to map name to id
        const leaguesRes = await fetch('/api/leagues');
        const leagues = await leaguesRes.json();
        const league = leagues.find(l => l.name.toLowerCase().replace(' ', '') === selectedLeague);
        if (!league) {
          console.warn('League not found for', selectedLeague);
          setLoading(false);
          return;
        }
        const leagueId = league._id;
        const [competitors, rounds] = await Promise.all([
          fetch(`/api/competitors/${leagueId}`).then(r => r.json()),
          fetch(`/api/rounds/${leagueId}`).then(r => r.json())
        ]);
        // Fetch submissions and votes for each round
        const submissionsPromises = rounds.map(r => fetch(`/api/submissions/${r._id}`).then(res => res.json()));
        const votesPromises = rounds.map(r => fetch(`/api/votes/${r._id}`).then(res => res.json()));
        const submissionsArrays = await Promise.all(submissionsPromises);
        const votesArrays = await Promise.all(votesPromises);
        const submissions = submissionsArrays.flat();
        const votes = votesArrays.flat();
        // Enrich submissions with metadata (single call per unique spotifyUri)
        const allMetadata = new Map();
        const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
          let metadata = allMetadata.get(sub.spotifyUri);
          if (!metadata) {
            const metaRes = await fetch(`/api/metadata/${encodeURIComponent(sub.spotifyUri)}`);
            metadata = await metaRes.json();
            if (metadata) allMetadata.set(sub.spotifyUri, metadata);
          }
          return { ...sub, metadata: metadata || null };
        }));
        const leagueKey = selectedLeague;
        setFetchedData(prev => ({
          ...prev,
          [leagueKey]: { competitors, rounds, submissions: enrichedSubmissions, votes }
        }));
      } catch (err) {
        console.error('Error loading league data', err);
      } finally {
        setLoading(false);
      }
    };
    loadLeagueData();
  }, [selectedLeague]);

  const leagueData = fetchedData[selectedLeague];

  // Analyze votes by genre (using real genre data from metadata)
  const genreAnalysis = useMemo(() => {
    if (!leagueData) return [];

    const genreVotes = {};
    const genreSubmissions = {};
    const genreData = {};  // Store additional genre info

    leagueData.submissions.forEach((submission) => {
      const spotifyUri = submission['Spotify URI'];
      const metadata = submission.metadata;

      // Get genre from metadata, skip if not available
      const genre = metadata?.genre;
      if (!genre) return;

      // Initialize genre tracking
      if (!genreSubmissions[genre]) {
        genreSubmissions[genre] = new Set();
        genreData[genre] = {
          allGenresCount: new Set(),  // Track unique genre combinations
          songs: []
        };
      }

      genreSubmissions[genre].add(spotifyUri);

      // Track all genres for this song
      if (metadata?.allGenres && metadata.allGenres.length > 0) {
        metadata.allGenres.forEach(g => genreData[genre].allGenresCount.add(g));
      }

      // Store song info
      genreData[genre].songs.push({
        title: submission.Title,
        artist: submission['Artist(s)'],
        spotifyUri
      });

      // Calculate votes
      const votes = leagueData.votes.filter(v => v['Spotify URI'] === spotifyUri);
      const totalPoints = votes.reduce((sum, v) => sum + parseInt(v['Points Assigned'] || 0), 0);

      genreVotes[genre] = (genreVotes[genre] || 0) + totalPoints;
    });

    return Object.entries(genreVotes)
      .map(([genre, votes]) => ({
        genre,
        votes,
        submissions: genreSubmissions[genre]?.size || 0,
        avgVotes: Math.round(votes / (genreSubmissions[genre]?.size || 1)),
        relatedGenres: Array.from(genreData[genre]?.allGenresCount || []).length,
      }))
      .sort((a, b) => b.votes - a.votes);
  }, [leagueData]);

  // Analyze votes by artist
  const artistAnalysis = useMemo(() => {
    if (!leagueData) return [];

    const artistVotes = {};

    leagueData.submissions.forEach((submission) => {
      const artist = submission['Artist(s)'];
      const spotifyUri = submission['Spotify URI'];

      const votes = leagueData.votes.filter(v => v['Spotify URI'] === spotifyUri);
      const totalPoints = votes.reduce((sum, v) => sum + parseInt(v['Points Assigned'] || 0), 0);

      if (artistVotes[artist]) {
        artistVotes[artist].votes += totalPoints;
        artistVotes[artist].submissions += 1;
      } else {
        artistVotes[artist] = {
          artist,
          votes: totalPoints,
          submissions: 1,
        };
      }
    });

    return Object.values(artistVotes)
      .map(data => ({
        ...data,
        avgVotes: Math.round(data.votes / data.submissions),
      }))
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10);
  }, [leagueData]);

  // Analyze popularity vs votes
  const popularityAnalysis = useMemo(() => {
    if (!leagueData) return [];

    return leagueData.submissions.slice(0, 50).map((submission) => {
      const spotifyUri = submission['Spotify URI'];
      const votes = leagueData.votes.filter(v => v['Spotify URI'] === spotifyUri);
      const totalPoints = votes.reduce((sum, v) => sum + parseInt(v['Points Assigned'] || 0), 0);
      const popularity = submission.metadata?.popularity || 0;

      return {
        title: submission.Title,
        artist: submission['Artist(s)'],
        votes: totalPoints,
        popularity,
      };
    });
  }, [leagueData]);

  if (loading || !leagueData) {
    return (
      <div className="text-center py-12 text-smoke">
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-smoke mb-2 block">League</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLeague('league1')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLeague === 'league1'
                  ? 'bg-mint text-charcoal'
                  : 'bg-charcoal text-smoke hover:text-mist'
                  }`}
              >
                League 1
              </button>
              <button
                onClick={() => setSelectedLeague('league2')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLeague === 'league2'
                  ? 'bg-mint text-charcoal'
                  : 'bg-charcoal text-smoke hover:text-mist'
                  }`}
              >
                League 2
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-smoke mb-2 block">View</label>
            <div className="flex gap-2 flex-wrap">
              {['genre', 'artist', 'popularity'].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${viewType === type
                    ? 'bg-lavender text-white'
                    : 'bg-charcoal text-smoke hover:text-mist'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Genre Analysis */}
      {viewType === 'genre' && (
        <div className="space-y-6">
          {/* Genre Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-graphite rounded-card p-6 shadow-card">
              <p className="text-sm text-smoke mb-1">Total Genres</p>
              <p className="text-3xl font-bold text-mint">{genreAnalysis.length}</p>
            </div>
            <div className="bg-graphite rounded-card p-6 shadow-card">
              <p className="text-sm text-smoke mb-1">Most Popular Genre</p>
              <p className="text-xl font-semibold text-mist">{genreAnalysis[0]?.genre || 'N/A'}</p>
              <p className="text-sm text-smoke mt-1">{genreAnalysis[0]?.votes || 0} votes</p>
            </div>
            <div className="bg-graphite rounded-card p-6 shadow-card">
              <p className="text-sm text-smoke mb-1">Avg Votes per Genre</p>
              <p className="text-3xl font-bold text-lavender">
                {genreAnalysis.length > 0
                  ? Math.round(genreAnalysis.reduce((sum, g) => sum + g.votes, 0) / genreAnalysis.length)
                  : 0}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-graphite rounded-card p-6 shadow-card">
            <h2 className="text-headline font-semibold text-mist mb-6">
              Genre Distribution & Voting Performance
            </h2>
            {genreAnalysis.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-smoke mb-2">No genre data available</p>
                <p className="text-sm text-smoke/70">
                  Run <code className="bg-charcoal px-2 py-1 rounded">node scripts/seed-genres.js</code> and <code className="bg-charcoal px-2 py-1 rounded">npm run export-metadata</code> to populate genre data
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-smoke mb-3">Total Votes by Genre</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={genreAnalysis.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
                        <XAxis
                          dataKey="genre"
                          stroke="#8D889B"
                          tick={{ fill: '#8D889B', fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#8D889B" tick={{ fill: '#8D889B' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F1E26',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#D3CFDA',
                          }}
                          content={({ payload }) => {
                            if (payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-graphite p-3 rounded-lg border border-smoke/20">
                                  <p className="text-mist font-medium mb-1">{data.genre}</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-mint">Total Votes: {data.votes}</p>
                                    <p className="text-smoke">{data.submissions} songs</p>
                                    <p className="text-smoke">Avg: {data.avgVotes} votes/song</p>
                                    {data.relatedGenres > 1 && (
                                      <p className="text-lavender text-xs">+{data.relatedGenres - 1} related genres</p>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="votes" fill="#4EE2B5" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-smoke mb-3">Genre Composition</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={genreAnalysis.slice(0, 8)}
                          dataKey="submissions"
                          nameKey="genre"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.genre} (${entry.submissions})`}
                          labelLine={{ stroke: '#8D889B' }}
                        >
                          {genreAnalysis.slice(0, 8).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F1E26',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#D3CFDA',
                          }}
                          content={({ payload }) => {
                            if (payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-graphite p-3 rounded-lg border border-smoke/20">
                                  <p className="text-mist font-medium mb-1">{data.genre}</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-mint">{data.submissions} songs ({Math.round(data.submissions / leagueData.submissions.length * 100)}%)</p>
                                    <p className="text-smoke">{data.votes} total votes</p>
                                    <p className="text-smoke">{data.avgVotes} avg votes</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Genre Details Table */}
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-smoke mb-4">Genre Performance Details</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {genreAnalysis.map((item, idx) => (
                      <div
                        key={item.genre}
                        className="flex items-center justify-between p-4 bg-charcoal rounded-lg hover:bg-charcoal/80 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div
                              className="w-5 h-5 rounded flex-shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <div>
                              <span className="text-mist font-medium capitalize">{item.genre}</span>
                              {item.relatedGenres > 1 && (
                                <span className="ml-2 text-xs text-lavender">
                                  +{item.relatedGenres - 1} related
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-8 flex-1 justify-end">
                            <div className="text-center">
                              <p className="text-xs text-smoke mb-1">Songs</p>
                              <p className="text-sm font-semibold text-mist">{item.submissions}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-smoke mb-1">Total Votes</p>
                              <p className="text-sm font-semibold text-mint">{item.votes}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-smoke mb-1">Avg Votes</p>
                              <p className="text-sm font-semibold text-cyan-flash">{item.avgVotes}</p>
                            </div>
                            <div className="text-center min-w-[80px]">
                              <p className="text-xs text-smoke mb-1">Performance</p>
                              <div className="h-2 bg-charcoal/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-mint to-cyan-flash rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (item.avgVotes / Math.max(...genreAnalysis.map(g => g.avgVotes))) * 100)}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Artist Analysis */}
      {viewType === 'artist' && (
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h2 className="text-headline font-semibold text-mist mb-6">
            Top Artists by Votes
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={artistAnalysis} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis type="number" stroke="#8D889B" tick={{ fill: '#8D889B' }} />
              <YAxis
                type="category"
                dataKey="artist"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F1E26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#D3CFDA',
                }}
              />
              <Bar dataKey="votes" fill="#2EC9FF" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-6 space-y-2">
            {artistAnalysis.map((item, idx) => (
              <div
                key={item.artist}
                className="flex items-center justify-between p-3 bg-charcoal rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-flash/20 flex items-center justify-center text-cyan-flash font-semibold">
                    {idx + 1}
                  </div>
                  <span className="text-mist font-medium">{item.artist}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-smoke">
                    {item.submissions} songs
                  </span>
                  <span className="text-cyan-flash font-medium">
                    {item.votes} total votes
                  </span>
                  <span className="text-smoke">
                    {item.avgVotes} avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popularity Analysis */}
      {viewType === 'popularity' && (
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h2 className="text-headline font-semibold text-mist mb-6">
            Popularity vs Votes Correlation
          </h2>
          <p className="text-sm text-smoke mb-6">
            Analyzing whether more popular songs (by stream count) receive more votes
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis
                type="number"
                dataKey="popularity"
                name="Popularity"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Popularity Score', position: 'bottom', fill: '#8D889B' }}
              />
              <YAxis
                type="number"
                dataKey="votes"
                name="Votes"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Total Votes', angle: -90, position: 'left', fill: '#8D889B' }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{
                  backgroundColor: '#1F1E26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#D3CFDA',
                }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-graphite p-3 rounded-lg border border-smoke/20">
                        <p className="text-mist font-medium mb-1">{data.title}</p>
                        <p className="text-smoke text-sm">{data.artist}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-mint">Votes: {data.votes}</p>
                          <p className="text-lavender">Popularity: {data.popularity}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Songs" data={popularityAnalysis} fill="#A178F1" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Analytics;

