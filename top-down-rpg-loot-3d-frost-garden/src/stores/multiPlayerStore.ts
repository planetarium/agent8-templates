import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import React from 'react';
import { RigidBody } from '@dimforge/rapier3d-compat';

type MultiPlayerRigidBodyState = {
  connectedPlayerRefs: Record<string, React.RefObject<RigidBody>>;
  registerConnectedPlayer: (account: string, rigidBodyRef: React.RefObject<RigidBody>) => void;
  unregisterConnectedPlayer: (account: string) => void;
  getConnectedPlayerRef: (account: string) => React.RefObject<RigidBody> | undefined;
  getAllConnectedPlayerRefs: () => Record<string, React.RefObject<RigidBody>>;
  getConnectedPlayerCount: () => number;
};

export const useMultiPlayerStore = create<MultiPlayerRigidBodyState>()(
  subscribeWithSelector((set, get) => ({
    connectedPlayerRefs: {},

    registerConnectedPlayer: (account: string, rigidBodyRef: React.RefObject<RigidBody>) => {
      set((state) => ({
        connectedPlayerRefs: {
          ...state.connectedPlayerRefs,
          [account]: rigidBodyRef,
        },
      }));
    },

    unregisterConnectedPlayer: (account: string) => {
      set((state) => {
        const newConnectedPlayerRefs = { ...state.connectedPlayerRefs };
        delete newConnectedPlayerRefs[account];
        return { connectedPlayerRefs: newConnectedPlayerRefs };
      });
    },

    getConnectedPlayerRef: (account: string) => {
      return get().connectedPlayerRefs[account];
    },

    getAllConnectedPlayerRefs: () => {
      return get().connectedPlayerRefs;
    },

    getConnectedPlayerCount: () => {
      return Object.keys(get().connectedPlayerRefs).length;
    },
  })),
);
