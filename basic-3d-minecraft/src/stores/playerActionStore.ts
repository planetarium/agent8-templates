interface PlayerActionState {
  punch: boolean;
  kick: boolean;
  meleeAttack: boolean;
  cast: boolean;
  addCube: boolean;
}

interface PlayerActionStore extends PlayerActionState {
  setPlayerAction: (action: string, pressed: boolean) => void;
  getPlayerAction: (action: string) => boolean;
  resetAllPlayerActions: () => void;
}

const playerActionStore: PlayerActionStore = {
  punch: false,
  kick: false,
  meleeAttack: false,
  cast: false,
  addCube: false,

  setPlayerAction: (action: string, pressed: boolean) => {
    (playerActionStore as any)[action] = pressed;
  },

  getPlayerAction: (action: string): boolean => {
    return (playerActionStore as any)[action];
  },

  resetAllPlayerActions: () => {
    playerActionStore.punch = false;
    playerActionStore.kick = false;
    playerActionStore.meleeAttack = false;
    playerActionStore.cast = false;
    playerActionStore.addCube = false;
  },
};

export const usePlayerActionStore = () => playerActionStore;