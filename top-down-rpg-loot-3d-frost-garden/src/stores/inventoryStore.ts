import { create } from 'zustand';

interface InventoryStore {
  flowers: number;
  setFlowers: (amount: number) => void;
  collectFlower: (amount: number) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  flowers: 0,
  setFlowers: (amount) => set({ flowers: amount }),
  collectFlower: (amount) => set((state) => ({ flowers: state.flowers + amount })),
}));
