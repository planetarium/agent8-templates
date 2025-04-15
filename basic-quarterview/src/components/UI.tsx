import React, { Suspense } from 'react';

/**
 * Main game scene component
 *
 * This component is responsible for setting up the 3D environment
 * including physics, lighting, and scene elements.
 */
export const UI: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
    </>
  );
};
