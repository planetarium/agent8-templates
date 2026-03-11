import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualityConfig {
  dpr: number;
  shadows: boolean;
  shadowMapSize: number;
  environmentResolution: number;
  antialias: boolean;
  waterEnabled: boolean;
  maxSouls: number;
  /** Max point lights for loot glow (perf critical) */
  lootPointLights: boolean;
  /** Fog density multiplier */
  fogDensity: number;
}

export const QUALITY_CONFIGS: Record<QualityLevel, QualityConfig> = {
  low: {
    dpr: 0.7,
    shadows: false,
    shadowMapSize: 512,
    environmentResolution: 64,
    antialias: false,
    waterEnabled: false,
    maxSouls: 10,
    lootPointLights: false,
    fogDensity: 0.015,
  },
  medium: {
    dpr: 1.0,
    shadows: true,
    shadowMapSize: 1024,
    environmentResolution: 128,
    antialias: false,
    waterEnabled: true,
    maxSouls: 15,
    lootPointLights: false,
    fogDensity: 0.012,
  },
  high: {
    dpr: Math.min(window.devicePixelRatio, 1.5),
    shadows: true,
    shadowMapSize: 2048,
    environmentResolution: 256,
    antialias: false,
    waterEnabled: true,
    maxSouls: 20,
    lootPointLights: true,
    fogDensity: 0.01,
  },
};

// Auto-detect initial quality based on device
function detectInitialQuality(): QualityLevel {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) return 'low';
  return 'high';
}

interface QualityState {
  quality: QualityLevel;
  config: QualityConfig;
  setQuality: (level: QualityLevel) => void;
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set) => ({
      quality: detectInitialQuality(),
      config: QUALITY_CONFIGS[detectInitialQuality()],
      setQuality: (level) =>
        set({ quality: level, config: QUALITY_CONFIGS[level] }),
    }),
    {
      name: 'inferno-quality',
    },
  ),
);
