import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/Overview';
import SongSearch from './components/SongSearch';
import Analytics from './components/Analytics';
import { loadAllData } from './utils/dataLoader';

function App() {
  const [activeView, setActiveView] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const allData = await loadAllData();
        setData(allData);
      } catch (err) {
        setError(err.message);
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
            {activeView === 'analytics' && <Analytics data={data} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
