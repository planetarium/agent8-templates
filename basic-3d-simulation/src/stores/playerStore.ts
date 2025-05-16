import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import React from 'react';
import { RigidBody } from '@dimforge/rapier3d-compat';

type PlayerRefsState = {
  playerRefs: Record<string, React.RefObject<RigidBody>>;
  registerPlayerRef: (key: string, ref: React.RefObject<RigidBody>) => void;
  unregisterPlayerRef: (key: string) => void;
  getPlayerRef: (key: string) => React.RefObject<RigidBody> | undefined;
};

const usePlayerStore = create<PlayerRefsState>()(
  subscribeWithSelector((set, get) => ({
    playerRefs: {},

    registerPlayerRef: (key: string, ref: React.RefObject<RigidBody>) => {
      set((state) => ({
        playerRefs: {
          ...state.playerRefs,
          [key]: ref,
        },
      }));
    },

    unregisterPlayerRef: (key: string) => {
      set((state) => {
        const newPlayerRefs = { ...state.playerRefs };
        delete newPlayerRefs[key];
        return { playerRefs: newPlayerRefs };
      });
    },

    getPlayerRef: (key: string) => {
      return get().playerRefs[key];
    },
  })),
);

export default usePlayerStore;
