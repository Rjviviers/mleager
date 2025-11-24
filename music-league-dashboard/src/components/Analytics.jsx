import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter } from 'recharts';
import { fetchLeagueAnalytics } from '../utils/dataLoader';

const COLORS = ['#4EE2B5', '#2EC9FF', '#A178F1', '#E044A7', '#FFE200'];

const Analytics = ({ data }) => {
  // data prop here is just { leagues: [...] } passed from App.jsx when view is 'analytics'
  // We need to fetch specific analytics data based on selected league.

  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [viewType, setViewType] = useState('genre');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize selected league
  useEffect(() => {
    if (data?.leagues?.length > 0 && !selectedLeagueId) {
      setSelectedLeagueId(data.leagues[0]._id);
    }
  }, [data, selectedLeagueId]);

  // Fetch analytics when league changes
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!selectedLeagueId) return;

      setLoading(true);
      setError(null);
      try {
        const stats = await fetchLeagueAnalytics(selectedLeagueId);
        setAnalyticsData(stats);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [selectedLeagueId]);

  if (!data?.leagues) {
    return <div className="text-center py-12 text-smoke">Loading leagues...</div>;
  }

  if (loading && !analyticsData) {
    return (
      <div className="text-center py-12 text-smoke">
        <div className="inline-block w-8 h-8 border-4 border-mint border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-magenta">{error}</div>;
  }

  const { genreAnalysis = [], artistAnalysis = [], popularityAnalysis = [] } = analyticsData || {};

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-smoke mb-2 block">League</label>
            <div className="flex gap-2">
              {data.leagues.map(league => (
                <button
                  key={league._id}
                  onClick={() => setSelectedLeagueId(league._id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedLeagueId === league._id
                    ? 'bg-mint text-charcoal'
                    : 'bg-charcoal text-smoke hover:text-mist'
                    }`}
                >
                  {league.name}
                </button>
              ))}
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
                              // Calculate percentage based on total submissions in top 8 or total?
                              // Let's just show count.
                              return (
                                <div className="bg-graphite p-3 rounded-lg border border-smoke/20">
                                  <p className="text-mist font-medium mb-1">{data.genre}</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="text-mint">{data.submissions} songs</p>
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
