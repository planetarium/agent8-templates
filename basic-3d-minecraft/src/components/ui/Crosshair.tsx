import React from 'react';

export const Crosshair: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="crosshair-container flex items-center justify-center w-6 h-6">
        <div className="crosshair-horizontal w-4 h-[2px] bg-white opacity-70"></div>
        <div className="crosshair-vertical h-4 w-[2px] bg-white opacity-70 absolute"></div>
        <div className="crosshair-dot w-1 h-1 bg-white opacity-90 rounded-full absolute"></div>
      </div>
    </div>
  );
};
