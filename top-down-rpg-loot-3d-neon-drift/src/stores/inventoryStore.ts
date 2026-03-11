import { create } from 'zustand';

interface InventoryStore {
  dataFragments: number;
  setDataFragments: (amount: number) => void;
  collectFragment: (amount: number) => void;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  dataFragments: 0,
  setDataFragments: (amount) => set({ dataFragments: amount }),
  collectFragment: (amount) => set((state) => ({ dataFragments: state.dataFragments + amount })),
}));
