import { create } from 'zustand';

interface InventoryStore {
  souls: number;
  setSouls: (amount: number) => void;
  collectSoul: (amount: number) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  souls: 0,
  setSouls: (amount) => set({ souls: amount }),
  collectSoul: (amount) => set((state) => ({ souls: state.souls + amount })),
}));
