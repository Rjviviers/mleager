import { Music, Users, Trophy } from 'lucide-react';
import StatCard from './StatCard';

const Overview = ({ data }) => {
  if (!data || !data.leagues) {
    return (
      <div className="text-center py-12 text-smoke">
        <p>Loading overview data...</p>
      </div>
    );
  }

  const { totalSubmissions, totalVotes, totalRounds, recentRounds, leagues } = data;

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
          {recentRounds.map((round, idx) => (
            <div
              key={round._id}
              className="bg-charcoal rounded-lg p-4 hover:bg-charcoal/80 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-mist font-medium mb-1">{round.name}</h3>
                  <p className="text-sm text-smoke line-clamp-2">{round.description}</p>
                </div>
                <span className="text-xs bg-lavender/20 text-lavender px-2 py-1 rounded-full whitespace-nowrap">
                  {round.leagueName}
                </span>
              </div>
              <div className="mt-2 text-xs text-smoke">
                Created: {new Date(round.created).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {leagues.map((league) => (
          <div key={league._id} className="bg-graphite rounded-card p-6 shadow-card">
            <h3 className="text-lg font-semibold text-mist mb-4">{league.name}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-smoke">Submissions</span>
                <span className="text-mint font-medium">{league.stats.submissions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoke">Votes Cast</span>
                <span className="text-mint font-medium">{league.stats.votes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoke">Competitors</span>
                <span className="text-mint font-medium">{league.stats.competitors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-smoke">Rounds</span>
                <span className="text-mint font-medium">{league.stats.rounds}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Overview;

