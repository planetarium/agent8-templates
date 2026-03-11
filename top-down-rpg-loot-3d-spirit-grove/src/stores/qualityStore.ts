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
  /** Max collectible orbs active at once */
  maxCrystals: number;
  /** Enable neon point lights in Experience (heavy on mobile GPU) */
  neonLightsEnabled: boolean;
  /** Max environment model placements (reduced on low) */
  maxObjectPlacements: number;
  /** Particle count for collect effects */
  particleCount: number;
}

export const QUALITY_CONFIGS: Record<QualityLevel, QualityConfig> = {
  low: {
    dpr: 0.65,
    shadows: false,
    shadowMapSize: 512,
    environmentResolution: 32,
    antialias: false,
    waterEnabled: false,
    maxCrystals: 8,
    neonLightsEnabled: false,
    maxObjectPlacements: 2,
    particleCount: 6,
  },
  medium: {
    dpr: 1.0,
    shadows: true,
    shadowMapSize: 1024,
    environmentResolution: 128,
    antialias: false,
    waterEnabled: false,
    maxCrystals: 14,
    neonLightsEnabled: true,
    maxObjectPlacements: 3,
    particleCount: 10,
  },
  high: {
    dpr: Math.min(window.devicePixelRatio, 1.5),
    shadows: true,
    shadowMapSize: 2048,
    environmentResolution: 256,
    antialias: false,
    waterEnabled: true,
    maxCrystals: 20,
    neonLightsEnabled: true,
    maxObjectPlacements: 4,
    particleCount: 12,
  },
};

function detectInitialQuality(): QualityLevel {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) {
    return 'low';
  }
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
      name: 'spiritgrove-quality',
    },
  ),
);
