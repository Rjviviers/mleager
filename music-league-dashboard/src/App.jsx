import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import SongSearch from './components/SongSearch';
import SongsTable from './components/SongsTable';
import Analytics from './components/Analytics';
import { fetchOverviewStats, fetchLeagues, fetchAllSongs } from './utils/dataLoader';

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache for songs data to avoid re-fetching
  const [songsCache, setSongsCache] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeView === 'overview') {
          const stats = await fetchOverviewStats();
          setData(stats);
        } else if (activeView === 'songs' || activeView === 'search') {
          // Use cache if available
          if (songsCache) {
            setData(songsCache);
          } else {
            const songs = await fetchAllSongs();
            setSongsCache(songs);
            setData(songs);
          }
        } else {
          // For other views, we might need different data.
          const leagues = await fetchLeagues();
          setData({ leagues }); // Partial data
        }
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeView]);

  return (
    <div className="min-h-screen bg-charcoal flex">
      {/* Sidebar */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <Header />

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-mint border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-smoke">Loading data...</p>
          </div>
        )}

        {error && (
          <div className="bg-graphite rounded-card p-6 border-l-4 border-magenta">
            <p className="text-magenta">Error loading data: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeView === 'overview' && <Overview data={data} />}
            {activeView === 'search' && <SongSearch data={data} />}
            {activeView === 'songs' && <SongsTable data={data} />}
            {activeView === 'analytics' && <Analytics data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
