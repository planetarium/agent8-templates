import { create } from 'zustand';

interface MiningStore {
  // ID of the crystal currently being mined (null = not mining)
  miningTargetId: string | null;
  // Progress 0.0 ~ 1.0
  miningProgress: number;
  // Set mining target
  startMining: (id: string) => void;
  // Update progress
  setMiningProgress: (progress: number) => void;
  // Cancel / complete mining
  stopMining: () => void;
}

export const useMiningStore = create<MiningStore>((set) => ({
  miningTargetId: null,
  miningProgress: 0,

  startMining: (id) => set({ miningTargetId: id, miningProgress: 0 }),

  setMiningProgress: (progress) => set({ miningProgress: progress }),

  stopMining: () => set({ miningTargetId: null, miningProgress: 0 }),
}));
