import { Music, Users, Trophy } from 'lucide-react';
import StatCard from './StatCard';

const Overview = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-smoke">
        <p>Loading overview data...</p>
      </div>
    );
  }

  const totalSubmissions =
    (data.league1?.submissions?.length || 0) +
    (data.league2?.submissions?.length || 0);

  const totalVotes =
    (data.league1?.votes?.length || 0) +
    (data.league2?.votes?.length || 0);

  const totalRounds =
    (data.league1?.rounds?.length || 0) +
    (data.league2?.rounds?.length || 0);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Submissions"
          value={totalSubmissions}
          accentColor="mint"
          icon={Music}
        />
        <StatCard
          title="Total Votes"
          value={totalVotes}
          accentColor="lavender"
          icon={Trophy}
        />
        <StatCard
          title="Active Rounds"
          value={totalRounds}
          accentColor="cyan"
          icon={Users}
        />
      </div>

      {/* Recent Rounds */}
      <div className="bg-graphite rounded-card p-6 shadow-card">
        <h2 className="text-headline font-semibold text-mist mb-4">
          Recent Rounds
        </h2>
        <div className="space-y-3">
          {data.league1?.rounds?.slice(0, 5).map((round, idx) => (
            <div
              key={round.ID}
              className="bg-charcoal rounded-lg p-4 hover:bg-charcoal/80 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-mist font-medium mb-1">{round.Name}</h3>
                  <p className="text-sm text-smoke line-clamp-2">{round.Description}</p>
                </div>
                <span className="text-xs bg-lavender/20 text-lavender px-2 py-1 rounded-full whitespace-nowrap">
                  League 1
                </span>
              </div>
              <div className="mt-2 text-xs text-smoke">
                Created: {new Date(round.Created).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">League 1</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-smoke">Submissions</span>
              <span className="text-mint font-medium">{data.league1?.submissions?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Votes Cast</span>
              <span className="text-mint font-medium">{data.league1?.votes?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Competitors</span>
              <span className="text-mint font-medium">{data.league1?.competitors?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Rounds</span>
              <span className="text-mint font-medium">{data.league1?.rounds?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-graphite rounded-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-mist mb-4">League 2</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-smoke">Submissions</span>
              <span className="text-cyan-flash font-medium">{data.league2?.submissions?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Votes Cast</span>
              <span className="text-cyan-flash font-medium">{data.league2?.votes?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Competitors</span>
              <span className="text-cyan-flash font-medium">{data.league2?.competitors?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Rounds</span>
              <span className="text-cyan-flash font-medium">{data.league2?.rounds?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;

