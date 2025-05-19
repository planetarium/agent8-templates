import { create } from 'zustand';

// Store for managing selection state
const useSelectStore = create((set) => ({
  // UUID of the selected object
  selectedUuid: null,

  // Select an object
  selectObject: (uuid) =>
    set((state) => ({
      selectedUuid: state.selectedUuid === uuid ? null : uuid,
    })),

  // Clear selection
  clearSelection: () => set({ selectedUuid: null }),
}));

export default useSelectStore;
