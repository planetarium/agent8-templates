interface PlayerActionState {
  meleeAttack: boolean;
}

interface PlayerActionStore extends PlayerActionState {
  setPlayerAction: (action: string, pressed: boolean) => void;
  getPlayerAction: (action: string) => boolean;
  resetAllPlayerActions: () => void;
}

const playerActionStore: PlayerActionStore = {
  meleeAttack: false,

  setPlayerAction: (action: string, pressed: boolean) => {
    (playerActionStore as any)[action] = pressed;
  },

  getPlayerAction: (action: string): boolean => {
    return (playerActionStore as any)[action];
  },

  resetAllPlayerActions: () => {
    playerActionStore.meleeAttack = false;
  },
};

export const usePlayerActionStore = () => playerActionStore;
