import { create } from 'zustand';
import { ActiveEffect, EffectData } from '../types';

// Define state interface
interface EffectState {
  activeEffects: ActiveEffect[]; // List of active effects
  effectKeyCounter: number; // Effect unique key counter
  // Action to add an effect
  addEffect: (type: string, sender?: string, config?: Record<string, any>) => number; // Returns the key of the added effect
  // Action to remove an effect
  removeEffect: (key: number) => void;
}

// Create Zustand store
export const useEffectStore = create<EffectState>((set, get) => ({
  activeEffects: [], // Initial state: empty array
  effectKeyCounter: 0, // Initial state: 0

  // Implement effect addition
  addEffect: (type, sender, config) => {
    const newKey = get().effectKeyCounter; // Generate a new key with the current counter value
    // Create EffectData object
    const effectData: EffectData = {
      type,
      config: config,
    };
    // Create ActiveEffect object
    const newEffect: ActiveEffect = {
      key: newKey,
      sender,
      effectData,
    };

    // State update: add new effect and increment counter
    set((state) => ({
      activeEffects: [...state.activeEffects, newEffect],
      effectKeyCounter: state.effectKeyCounter + 1,
    }));

    // console.log(`[EffectStore] Effect added: key=${newKey}, type=${type}`); // Debugging log (optional)
    return newKey; // Return the generated key
  },

  // Implement effect removal
  removeEffect: (keyToRemove: number) => {
    // State update: filter and remove the effect with the corresponding key
    set((state) => ({
      activeEffects: state.activeEffects.filter((effect) => effect.key !== keyToRemove),
    }));
    // console.log(`[EffectStore] Effect removed: key=${keyToRemove}`); // Debugging log (optional)
  },
}));

// Convenience selector hook (optional)
export const useActiveEffects = () => useEffectStore((state) => state.activeEffects);
