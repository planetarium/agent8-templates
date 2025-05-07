import React from 'react';
import { networkSyncStore } from '../../stores/networkSyncStore';

const RTT: React.FC = () => {
  const rtt = networkSyncStore((state) => state.rtt);

  return (
    <div className="px-3 py-1 bg-black/30 text-white rounded border border-gray-500 text-sm">
      Ping: <span className="font-semibold">{rtt !== null ? `${rtt.toFixed(0)}ms` : 'N/A'}</span>
    </div>
  );
};

export default RTT;
