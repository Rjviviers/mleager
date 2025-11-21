import React from 'react';
import DataSync from './Admin/DataSync';

const Header = () => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Music League Dashboard</h1>
        <p className="text-smoke mt-2">Track your league stats and analytics</p>
      </div>
      <DataSync />
    </div>
  );
};

export default Header;
