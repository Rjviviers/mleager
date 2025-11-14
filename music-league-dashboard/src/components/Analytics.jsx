import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ScatterChart, Scatter } from 'recharts';
import { extractGenreFromArtist, getMockPopularity } from '../utils/dataLoader';

const COLORS = ['#4EE2B5', '#2EC9FF', '#A178F1', '#E044A7', '#FFE200'];

const Analytics = ({ data }) => {
  const [selectedLeague, setSelectedLeague] = useState('league1');
  const [viewType, setViewType] = useState('genre');

  const leagueData = data?.[selectedLeague];

  // Analyze votes by genre
  const genreAnalysis = useMemo(() => {
    if (!leagueData) return [];

    const genreVotes = {};
    const genreSubmissions = {};

    leagueData.submissions.forEach((submission) => {
      const artist = submission['Artist(s)'];
      const genre = extractGenreFromArtist(artist);
      const spotifyUri = submission['Spotify URI'];

      if (!genreSubmissions[genre]) {
        genreSubmissions[genre] = new Set();
      }
      genreSubmissions[genre].add(spotifyUri);

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
      const popularity = getMockPopularity(submission.Title);

      return {
        title: submission.Title,
        artist: submission['Artist(s)'],
        votes: totalPoints,
        popularity,
      };
    });
  }, [leagueData]);

  if (!data) {
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedLeague === 'league1'
                    ? 'bg-mint text-charcoal'
                    : 'bg-charcoal text-smoke hover:text-mist'
                }`}
              >
                League 1
              </button>
              <button
                onClick={() => setSelectedLeague('league2')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedLeague === 'league2'
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
            <div className="flex gap-2">
              {['genre', 'artist', 'popularity'].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                    viewType === type
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
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h2 className="text-headline font-semibold text-mist mb-6">
            Votes by Genre
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genreAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFFFFF10" />
                  <XAxis dataKey="genre" stroke="#8D889B" tick={{ fill: '#8D889B' }} />
                  <YAxis stroke="#8D889B" tick={{ fill: '#8D889B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F1E26',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#D3CFDA',
                    }}
                  />
                  <Bar dataKey="votes" fill="#4EE2B5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreAnalysis}
                    dataKey="votes"
                    nameKey="genre"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.genre}
                  >
                    {genreAnalysis.map((entry, index) => (
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
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {genreAnalysis.map((item, idx) => (
              <div
                key={item.genre}
                className="flex items-center justify-between p-3 bg-charcoal rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-mist font-medium">{item.genre}</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <span className="text-smoke">
                    {item.submissions} songs
                  </span>
                  <span className="text-mint font-medium">
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

