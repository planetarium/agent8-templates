import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';

type PlayerState = {
  position: THREE.Vector3;
  /**
   * Player speed in meters per second (m/s)
   * - Convert to km/h by multiplying by 3.6
   * - Formula: m/s × 3.6 = km/h
   */
  speed: number;
};

type LocalPlayerState = {
  state: PlayerState;
  /**
   * Set speed
   * @param speed Speed value in meters per second (m/s)
   */
  setSpeed: (speed: number) => void;
  setPosition: (x: number, y: number, z: number) => void;
  clearPosition: () => void;
};

export const useLocalPlayerStore = create<LocalPlayerState>()(
  subscribeWithSelector((_, get) => ({
    state: {
      position: new THREE.Vector3(0, 0, 0),
      speed: 0,
    },

    setSpeed: (speed: number) => {
      get().state.speed = speed;
    },

    setPosition: (x: number, y: number, z: number) => {
      const state = get().state;
      state.position.x = x;
      state.position.y = y;
      state.position.z = z;
    },

    clearPosition: () => {
      const state = get().state;
      state.position.x = 0;
      state.position.y = 0;
      state.position.z = 0;
    },
  })),
);
