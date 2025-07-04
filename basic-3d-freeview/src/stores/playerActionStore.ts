import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface PlayerActionState {
  punch: boolean;
  kick: boolean;
  meleeAttack: boolean;
  cast: boolean;
}

interface PlayerActionStore extends PlayerActionState {
  setPlayerAction: (action: string, pressed: boolean) => void;
  getPlayerAction: (action: string) => boolean;
  resetAllPlayerActions: () => void;
}

const initialPlayerActionState: PlayerActionState = {
  punch: false,
  kick: false,
  meleeAttack: false,
  cast: false,
};

export const usePlayerActionStore = create<PlayerActionStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialPlayerActionState,

    setPlayerAction: (action: string, pressed: boolean) => {
      set((state) => ({
        ...state,
        [action]: pressed,
      }));
    },

    getPlayerAction: (action: string) => {
      return get()[action as keyof PlayerActionState];
    },

    resetAllPlayerActions: () => {
      set(() => ({ ...initialPlayerActionState }));
    },
  })),
);
