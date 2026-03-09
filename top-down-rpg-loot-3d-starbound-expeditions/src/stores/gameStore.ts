import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface GameStore {
  isMapPhysicsReady: boolean;
  setMapPhysicsReady: (ready: boolean) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    isMapPhysicsReady: false,
    setMapPhysicsReady: (ready: boolean) => set({ isMapPhysicsReady: ready }),
  })),
);
