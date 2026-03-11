import { create } from 'zustand';

interface InventoryStore {
  relics: number;
  setRelics: (amount: number) => void;
  collectRelic: (amount: number) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  relics: 0,
  setRelics: (amount) => set({ relics: amount }),
  collectRelic: (amount) => set((state) => ({ relics: state.relics + amount })),
}));
