import { Music, BarChart3, Search } from 'lucide-react';

const Sidebar = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'overview', icon: Music, label: 'Overview' },
    { id: 'search', icon: Search, label: 'Search Songs' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="w-20 bg-ink flex flex-col items-center py-8 space-y-6">
      {/* Brand Icon */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-flash to-lavender flex items-center justify-center mb-4">
        <Music className="w-6 h-6 text-white" />
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-graphite text-mint'
                  : 'text-smoke hover:text-mist hover:bg-graphite/50'
              }`}
              title={item.label}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-8 bg-mint rounded-r-full" />
              )}
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;

