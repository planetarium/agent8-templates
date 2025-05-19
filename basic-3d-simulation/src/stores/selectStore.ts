import { create } from 'zustand';

// 선택 관련 상태 관리 스토어
const useSelectStore = create((set) => ({
  // 선택된 객체의 UUID
  selectedUuid: null,

  // 객체 선택
  selectObject: (uuid) =>
    set((state) => ({
      selectedUuid: state.selectedUuid === uuid ? null : uuid,
    })),

  // 선택 해제
  clearSelection: () => set({ selectedUuid: null }),
}));

export default useSelectStore;
