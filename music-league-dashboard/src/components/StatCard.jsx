const StatCard = ({ title, value, change, accentColor, icon: Icon }) => {
  const accentClasses = {
    mint: 'border-mint/20 bg-mint/5',
    lavender: 'border-lavender/20 bg-lavender/5',
    cyan: 'border-cyan-flash/20 bg-cyan-flash/5',
  };

  return (
    <div
      className={`bg-graphite rounded-card p-6 shadow-card border-l-4 ${accentClasses[accentColor]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-smoke text-sm uppercase tracking-wide">{title}</div>
        {Icon && (
          <div className={`w-10 h-10 rounded-full bg-${accentColor}/10 flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${accentColor}`} />
          </div>
        )}
      </div>
      <div className="text-3xl font-semibold text-mist mb-1">{value}</div>
      {change && (
        <div className="text-sm text-mint">
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
  );
};

export default StatCard;

