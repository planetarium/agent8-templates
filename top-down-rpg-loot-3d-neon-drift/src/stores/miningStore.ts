import { create } from 'zustand';

interface HackingStore {
  hackingTargetId: string | null;
  hackingProgress: number;
  startHacking: (id: string) => void;
  setHackingProgress: (progress: number) => void;
  stopHacking: () => void;
}

export const useHackingStore = create<HackingStore>((set) => ({
  hackingTargetId: null,
  hackingProgress: 0,
  startHacking: (id) => set({ hackingTargetId: id, hackingProgress: 0 }),
  setHackingProgress: (progress) => set({ hackingProgress: progress }),
  stopHacking: () => set({ hackingTargetId: null, hackingProgress: 0 }),
}));
