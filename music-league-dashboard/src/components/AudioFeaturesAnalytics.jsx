import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Cell } from 'recharts';

const COLORS = ['#4EE2B5', '#2EC9FF', '#A178F1', '#E044A7', '#FFE200'];

const AudioFeaturesAnalytics = ({ leagueData }) => {
  // Calculate votes for each song and enrich with metadata
  const songsWithVotes = useMemo(() => {
    if (!leagueData) return [];

    return leagueData.submissions
      .filter(submission => submission.metadata) // Only include songs with metadata
      .map((submission) => {
        const spotifyUri = submission['Spotify URI'];
        const votes = leagueData.votes.filter(v => v['Spotify URI'] === spotifyUri);
        const totalPoints = votes.reduce((sum, v) => sum + parseInt(v['Points Assigned'] || 0), 0);

        return {
          title: submission.Title,
          artist: submission['Artist(s)'],
          spotifyUri,
          votes: totalPoints,
          voteCount: votes.length,
          ...submission.metadata,
        };
      });
  }, [leagueData]);

  // Calculate correlation between audio features and votes
  const featureCorrelations = useMemo(() => {
    if (songsWithVotes.length === 0) return [];

    const features = ['energy', 'danceability', 'valence', 'acousticness', 'tempo', 'loudness'];

    return features.map(feature => {
      // Calculate Pearson correlation coefficient
      const n = songsWithVotes.length;
      const xValues = songsWithVotes.map(s => feature === 'tempo' ? s[feature] / 200 : feature === 'loudness' ? (s[feature] + 60) / 60 : s[feature]);
      const yValues = songsWithVotes.map(s => s.votes);

      const xMean = xValues.reduce((a, b) => a + b, 0) / n;
      const yMean = yValues.reduce((a, b) => a + b, 0) / n;

      let numerator = 0;
      let xDenom = 0;
      let yDenom = 0;

      for (let i = 0; i < n; i++) {
        const xDiff = xValues[i] - xMean;
        const yDiff = yValues[i] - yMean;
        numerator += xDiff * yDiff;
        xDenom += xDiff * xDiff;
        yDenom += yDiff * yDiff;
      }

      const correlation = numerator / Math.sqrt(xDenom * yDenom);

      return {
        feature: feature.charAt(0).toUpperCase() + feature.slice(1),
        correlation: isNaN(correlation) ? 0 : correlation,
        avgInTopSongs: 0, // Will calculate below
        avgInBottomSongs: 0,
      };
    });
  }, [songsWithVotes]);

  // Compare top vs bottom performing songs
  const topVsBottomComparison = useMemo(() => {
    if (songsWithVotes.length < 10) return [];

    const sorted = [...songsWithVotes].sort((a, b) => b.votes - a.votes);
    const topCount = Math.ceil(sorted.length * 0.2); // Top 20%
    const bottomCount = Math.ceil(sorted.length * 0.2); // Bottom 20%

    const topSongs = sorted.slice(0, topCount);
    const bottomSongs = sorted.slice(-bottomCount);

    const features = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness', 'speechiness'];

    return features.map(feature => {
      const topAvg = topSongs.reduce((sum, s) => sum + s[feature], 0) / topSongs.length;
      const bottomAvg = bottomSongs.reduce((sum, s) => sum + s[feature], 0) / bottomSongs.length;

      return {
        feature: feature.charAt(0).toUpperCase() + feature.slice(1),
        topSongs: parseFloat((topAvg * 100).toFixed(1)),
        bottomSongs: parseFloat((bottomAvg * 100).toFixed(1)),
        difference: parseFloat(((topAvg - bottomAvg) * 100).toFixed(1)),
      };
    });
  }, [songsWithVotes]);

  // Energy vs Votes scatter data
  const energyVotesData = useMemo(() => {
    return songsWithVotes.map(s => ({
      x: s.energy * 100,
      y: s.votes,
      title: s.title,
      artist: s.artist,
    }));
  }, [songsWithVotes]);

  // Danceability vs Votes scatter data
  const danceabilityVotesData = useMemo(() => {
    return songsWithVotes.map(s => ({
      x: s.danceability * 100,
      y: s.votes,
      title: s.title,
      artist: s.artist,
    }));
  }, [songsWithVotes]);

  // Valence (mood) vs Votes scatter data
  const valenceVotesData = useMemo(() => {
    return songsWithVotes.map(s => ({
      x: s.valence * 100,
      y: s.votes,
      title: s.title,
      artist: s.artist,
    }));
  }, [songsWithVotes]);

  // Average votes by energy level
  const votesByEnergyLevel = useMemo(() => {
    if (songsWithVotes.length === 0) return [];

    const levels = [
      { name: 'Low (0-33)', min: 0, max: 0.33 },
      { name: 'Medium (33-66)', min: 0.33, max: 0.66 },
      { name: 'High (66-100)', min: 0.66, max: 1.0 },
    ];

    return levels.map(level => {
      const songsInLevel = songsWithVotes.filter(s => s.energy >= level.min && s.energy < level.max);
      const avgVotes = songsInLevel.length > 0
        ? songsInLevel.reduce((sum, s) => sum + s.votes, 0) / songsInLevel.length
        : 0;

      return {
        level: level.name,
        avgVotes: parseFloat(avgVotes.toFixed(1)),
        count: songsInLevel.length,
      };
    });
  }, [songsWithVotes]);

  // Average votes by danceability level
  const votesByDanceabilityLevel = useMemo(() => {
    if (songsWithVotes.length === 0) return [];

    const levels = [
      { name: 'Low', min: 0, max: 0.33 },
      { name: 'Medium', min: 0.33, max: 0.66 },
      { name: 'High', min: 0.66, max: 1.0 },
    ];

    return levels.map(level => {
      const songsInLevel = songsWithVotes.filter(s => s.danceability >= level.min && s.danceability < level.max);
      const avgVotes = songsInLevel.length > 0
        ? songsInLevel.reduce((sum, s) => sum + s.votes, 0) / songsInLevel.length
        : 0;

      return {
        level: level.name,
        avgVotes: parseFloat(avgVotes.toFixed(1)),
        count: songsInLevel.length,
      };
    });
  }, [songsWithVotes]);

  if (songsWithVotes.length === 0) {
    return (
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <div className="text-center py-12">
          <p className="text-smoke text-lg mb-2">No song metadata available</p>
          <p className="text-sm text-smoke/70 mb-4">
            Run the following commands to fetch and analyze song metadata:
          </p>
          <div className="bg-charcoal rounded-lg p-4 text-left max-w-2xl mx-auto">
            <code className="text-mint text-sm">
              npm run fetch-metadata<br/>
              npm run export-metadata
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top vs Bottom Songs Comparison */}
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <h2 className="text-headline font-semibold text-mist mb-4">
          Audio Features: Top 20% vs Bottom 20% Songs
        </h2>
        <p className="text-sm text-smoke mb-6">
          Comparing audio features between highest and lowest voted songs
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={topVsBottomComparison}>
              <PolarGrid stroke="#FFFFFF20" />
              <PolarAngleAxis dataKey="feature" tick={{ fill: '#8D889B', fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#8D889B' }} />
              <Radar name="Top Songs" dataKey="topSongs" stroke="#4EE2B5" fill="#4EE2B5" fillOpacity={0.6} />
              <Radar name="Bottom Songs" dataKey="bottomSongs" stroke="#E044A7" fill="#E044A7" fillOpacity={0.6} />
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F1E26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#D3CFDA',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {/* Comparison Table */}
          <div className="space-y-2">
            {topVsBottomComparison.map((item, idx) => (
              <div key={item.feature} className="flex items-center justify-between p-3 bg-charcoal rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-mist font-medium">{item.feature}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-mint">Top: {item.topSongs}%</span>
                  <span className="text-magenta">Bottom: {item.bottomSongs}%</span>
                  <span className={`font-medium ${item.difference > 0 ? 'text-mint' : item.difference < 0 ? 'text-magenta' : 'text-smoke'}`}>
                    {item.difference > 0 ? '+' : ''}{item.difference}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scatter Plots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy vs Votes */}
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">Energy vs Votes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis
                type="number"
                dataKey="x"
                name="Energy"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Energy (%)', position: 'bottom', fill: '#8D889B' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Votes"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Votes', angle: -90, position: 'left', fill: '#8D889B' }}
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
                          <p className="text-mint">Votes: {data.y}</p>
                          <p className="text-lavender">Energy: {data.x.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={energyVotesData} fill="#4EE2B5" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Danceability vs Votes */}
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">Danceability vs Votes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis
                type="number"
                dataKey="x"
                name="Danceability"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Danceability (%)', position: 'bottom', fill: '#8D889B' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Votes"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Votes', angle: -90, position: 'left', fill: '#8D889B' }}
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
                          <p className="text-mint">Votes: {data.y}</p>
                          <p className="text-cyan-flash">Danceability: {data.x.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={danceabilityVotesData} fill="#2EC9FF" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Valence vs Votes */}
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">Valence (Mood) vs Votes</h3>
          <p className="text-xs text-smoke mb-4">Higher valence = more positive/happy mood</p>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis
                type="number"
                dataKey="x"
                name="Valence"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Valence (%)', position: 'bottom', fill: '#8D889B' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Votes"
                stroke="#8D889B"
                tick={{ fill: '#8D889B' }}
                label={{ value: 'Votes', angle: -90, position: 'left', fill: '#8D889B' }}
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
                          <p className="text-mint">Votes: {data.y}</p>
                          <p className="text-lavender">Valence: {data.x.toFixed(1)}%</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={valenceVotesData} fill="#A178F1" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average Votes by Feature Levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Energy Levels */}
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">Average Votes by Energy Level</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={votesByEnergyLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis dataKey="level" stroke="#8D889B" tick={{ fill: '#8D889B' }} />
              <YAxis stroke="#8D889B" tick={{ fill: '#8D889B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F1E26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#D3CFDA',
                }}
              />
              <Bar dataKey="avgVotes" fill="#4EE2B5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {votesByEnergyLevel.map((item, idx) => (
              <div key={item.level} className="flex justify-between text-sm">
                <span className="text-smoke">{item.level}</span>
                <span className="text-mint">{item.avgVotes} avg votes ({item.count} songs)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danceability Levels */}
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">Average Votes by Danceability</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={votesByDanceabilityLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
              <XAxis dataKey="level" stroke="#8D889B" tick={{ fill: '#8D889B' }} />
              <YAxis stroke="#8D889B" tick={{ fill: '#8D889B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F1E26',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#D3CFDA',
                }}
              />
              <Bar dataKey="avgVotes" fill="#2EC9FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {votesByDanceabilityLevel.map((item, idx) => (
              <div key={item.level} className="flex justify-between text-sm">
                <span className="text-smoke">{item.level}</span>
                <span className="text-cyan-flash">{item.avgVotes} avg votes ({item.count} songs)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioFeaturesAnalytics;

