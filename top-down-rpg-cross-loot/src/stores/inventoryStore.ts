import { create } from 'zustand';

interface InventoryStore {
  crystals: number;
  setCrystals: (amount: number) => void;
  collectCrystal: (amount: number) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  crystals: 0,
  setCrystals: (amount) => set({ crystals: amount }),
  collectCrystal: (amount) => set((state) => ({ crystals: state.crystals + amount })),
}));
